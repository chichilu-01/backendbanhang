const store = {
  otp: {}, // { email: { code, data, expires } }
  reset: {}, // { email: { code, expires } }
};

export const isCodeValid = (storeType, email, code) => {
  const entry = store[storeType][email];
  if (!entry || Date.now() > entry.expires)
    return { valid: false, error: "Mã đã hết hạn." };
  if (parseInt(code) !== entry.code)
    return { valid: false, error: "Mã không chính xác." };
  return { valid: true, entry };
};

export const getOtpStore = () => store.otp;
export const getResetStore = () => store.reset;

export default store;
