export function generateOtp(length: number): string {
  let otp = '';

  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 9).toString();
  }

  return otp;
}
