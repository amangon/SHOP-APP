export const MAKING_CHARGE_PERCENT = 0.10;

export const calculateProductPrice = (
  weightGrams: number,
  ratePerGram: number
): {
  goldValue: number;
  makingChargePercent: number;
  makingAmount: number;
  finalPrice: number;
} => {
  const weight = Number(weightGrams);
  const rate = Number(ratePerGram);

  if (!Number.isFinite(weight) || weight <= 0) {
    return {
      goldValue: 0,
      makingChargePercent: MAKING_CHARGE_PERCENT,
      makingAmount: 0,
      finalPrice: 0,
    };
  }

  if (!Number.isFinite(rate) || rate <= 0) {
    return {
      goldValue: 0,
      makingChargePercent: MAKING_CHARGE_PERCENT,
      makingAmount: 0,
      finalPrice: 0,
    };
  }

  const goldValue = weight * rate;
  const makingChargePercent = MAKING_CHARGE_PERCENT;
  const makingAmount = goldValue * makingChargePercent;
  const finalPrice = goldValue + makingAmount;

  return {
    goldValue,
    makingChargePercent,
    makingAmount,
    finalPrice,
  };
};

export const formatINR = (value: number): string => {
  if (!Number.isFinite(value)) return '₹0';
  return `₹${value.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export const formatWeight = (grams: number): string => {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 1)} kg`;
  }
  return `${grams}g`;
};