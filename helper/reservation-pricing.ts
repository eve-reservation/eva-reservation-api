import { Prisma, RateType } from "../generated/prisma";

type BookingPeriodInput = {
	startDateTime: Date;
	endDateTime: Date;
	numberOfDays?: number | null;
	numberOfHours?: number | null;
	originalHours?: number | null;
	extendedHours?: number | null;
};

type ChargesInput = {
	driverFee?: number | null;
	serviceFee?: number | null;
	extensionFee?: number | null;
	addonFee?: number | null;
};

type DiscountsInput = {
	discount?: number | null;
	discountPercentage?: number | null;
	couponCode?: string | null;
};

type DiscountsOutput = {
	discount: number;
	discountPercentage?: number;
	couponCode?: string;
};

type PricingBaseOutput = {
	planBasePrice: number;
	daysBooked: number;
	planTotal: number;
};

type ChargesOutput = {
	driverFee: number;
	serviceFee: number;
	extensionFee: number;
	addonFee: number;
};

type TaxesOutput = {
	tax: number;
	taxPercentage: number;
};

type TotalsOutput = {
	subtotal: number;
	totalAmount: number;
};

type PricingResult = {
	pricingBase: PricingBaseOutput;
	charges: ChargesOutput;
	taxes: TaxesOutput;
	discounts?: DiscountsOutput;
	totals: TotalsOutput;
	currency: string;
};

function coerceNumber(val: number | string | null | undefined, fallback = 0): number {
	if (val === null || val === undefined) return fallback;
	const num = typeof val === "string" ? parseFloat(val) : val;
	return isNaN(num as number) ? fallback : (num as number);
}

/**
 * Compute reservation pricing based on facility rate type and booking period.
 * - Supports hourly vs non-hourly billingCycle by using numberOfHours or numberOfDays.
 * - Applies serviceFee/tax from RateType, and optional addon/driver/extension fees.
 * - Discounts subtract from the final totalAmount.
 */
export function computeReservationPricing(
	rateType: RateType,
	bookingPeriod: BookingPeriodInput,
	inputCharges: ChargesInput = {},
	discounts?: DiscountsInput | null,
): PricingResult {
	const billingCycle = (rateType.billingCycle || "").toLowerCase();
	const baseRate = coerceNumber(rateType.baseRate, 0);
	const serviceFeeRate = coerceNumber(rateType.serviceFee, 0);
	const taxPercentage = rateType.tax !== null && rateType.tax !== undefined ? rateType.tax : 12;

	// Determine quantity
	const hours = coerceNumber(bookingPeriod.numberOfHours, 0);
	const days = coerceNumber(bookingPeriod.numberOfDays, 0);
	const extendedHours = coerceNumber(bookingPeriod.extendedHours, 0);

	let quantity = 1;
	if (billingCycle.includes("hour")) {
		quantity = hours > 0 ? hours + extendedHours : Math.max((days || 0) * 24 + extendedHours, 1);
	} else {
		quantity = days > 0 ? days : 1;
	}

	const planTotal = baseRate * quantity;

	const charges: ChargesOutput = {
		driverFee: coerceNumber(inputCharges.driverFee, 0),
		serviceFee: serviceFeeRate,
		extensionFee: coerceNumber(inputCharges.extensionFee, 0),
		addonFee: coerceNumber(inputCharges.addonFee, 0),
	};

	const subtotal = planTotal + charges.driverFee + charges.serviceFee + charges.extensionFee + charges.addonFee;
	const tax = subtotal * (taxPercentage / 100);

	const discountValue = coerceNumber(discounts?.discount, 0);
	const totalAmount = subtotal + tax - discountValue;

	const pricingBase: PricingBaseOutput = {
		planBasePrice: baseRate,
		daysBooked: billingCycle.includes("hour") ? Math.ceil(quantity / 24) : quantity,
		planTotal,
	};

	const taxes: TaxesOutput = {
		tax,
		taxPercentage,
	};

		return {
		pricingBase,
		charges,
		taxes,
			discounts:
				discounts && discountValue > 0
					? {
							discount: discountValue,
							discountPercentage: discounts.discountPercentage ?? undefined,
							couponCode:
								discounts.couponCode === null || discounts.couponCode === undefined
									? undefined
									: discounts.couponCode,
					  }
					: undefined,
		totals: {
			subtotal,
			totalAmount,
		},
		currency: rateType.currency || "USD",
	};
}

