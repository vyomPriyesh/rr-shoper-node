import Subscription from "../models/Subscription.js";

const getSubscriptionDates = (billingPeriod, startsAt = new Date()) => {
    if (billingPeriod === 'onetime') {
        return { startsAt, expiresAt: null };
    }

    const expiresAt = new Date(startsAt);

    if (billingPeriod === 'year') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    return { startsAt, expiresAt };
};

const getNextStartDate = async ({ customerId, packageId, now }) => {
    const currentSubscription = await Subscription.findOne({
        customer_id: customerId,
        package_id: packageId,
        status: 'active',
        expires_at: { $gt: now },
    }).sort({ expires_at: -1 });

    return currentSubscription?.expires_at || now;
};

export const createSubscription = async ({ customerId, packageData, paymentId, billingPeriod }) => {
    const now = new Date();
    const startsAt = await getNextStartDate({
        customerId,
        packageId: packageData._id,
        now,
    });
    const { expiresAt } = getSubscriptionDates(billingPeriod, startsAt);

    return Subscription.create({
        customer_id: customerId,
        package_id: packageData._id,
        payment_id: paymentId,
        billing_period: billingPeriod,
        starts_at: startsAt,
        expires_at: expiresAt,
    });
};

export const getSamePlatformActiveSubscriptions = async (customerId, platform, now = new Date()) => {
    const data = await Subscription.find({
        customer_id: customerId,
        status: 'active',
        $or: [
            { expires_at: null },
            { expires_at: { $gt: now } },
        ],
    }).populate({
        path: 'package_id',
    });

    return data.find(subscription => subscription.package_id?.platform?.equals(platform));
}

export const upgradeSubscription = async ({ customerId, platform, packageData, paymentId, billingPeriod }) => {
    const now = new Date();
    const currentSubscription = await getSamePlatformActiveSubscriptions(customerId, platform, now);
    const { expiresAt: planExpiresAt } = getSubscriptionDates(billingPeriod, now);
    const remainingMilliseconds = currentSubscription?.expires_at
        ? Math.max(currentSubscription.expires_at.getTime() - now.getTime(), 0)
        : 0;
    const expiresAt = planExpiresAt
        ? new Date(planExpiresAt.getTime() + remainingMilliseconds)
        : null;

    const upgradedSubscription = await Subscription.findByIdAndUpdate(currentSubscription._id, {
        customer_id: customerId,
        package_id: packageData._id,
        payment_id: paymentId,
        billing_period: billingPeriod,
        starts_at: now,
        expires_at: expiresAt,
    });

    return upgradedSubscription;

}

export const getActiveSubscriptions = async (customerId, now = new Date()) => {
    return Subscription.find({
        customer_id: customerId,
        status: 'active',
        $or: [
            { expires_at: null },
            { expires_at: { $gt: now } },
        ],
    }).populate({
        path: 'package_id',
        populate: { path: 'platform' },
    });
};