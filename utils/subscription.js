import Subscription from "../models/Subscription.js";

const getSubscriptionDates = (billingPeriod, startsAt = new Date()) => {
    if (billingPeriod === 'lifetime') {
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

export const getActiveSubscriptions = async (customerId, now = new Date()) => {
    return Subscription.find({
        customer_id: customerId,
        status: 'active',
        $or: [
            { expires_at: null },
            { expires_at: { $gt: now } },
        ],
    }).populate('package_id');
};