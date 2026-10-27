/**
 * The 200 most common passwords (lowercase). A signup password is rejected
 * when it appears here, or when it equals the email or the phone number.
 * This is a small local list on purpose: no network call, no library.
 */
export const COMMON_PASSWORDS: ReadonlySet<string> = new Set([
  "123456", "password", "12345678", "qwerty", "123456789", "12345", "1234",
  "111111", "1234567", "dragon", "123123", "baseball", "abc123", "football",
  "monkey", "letmein", "shadow", "master", "666666", "qwertyuiop", "123321",
  "mustang", "1234567890", "michael", "654321", "superman", "1qaz2wsx",
  "7777777", "121212", "000000", "qazwsx", "123qwe", "killer", "trustno1",
  "jordan", "jennifer", "zxcvbnm", "asdfgh", "hunter", "buster", "soccer",
  "harley", "batman", "andrew", "tigger", "sunshine", "iloveyou", "2000",
  "charlie", "robert", "thomas", "hockey", "ranger", "daniel", "starwars",
  "klaster", "112233", "george", "computer", "michelle", "jessica", "pepper",
  "1111", "zxcvbn", "555555", "11111111", "131313", "freedom", "777777",
  "pass", "maggie", "159753", "aaaaaa", "ginger", "princess", "joshua",
  "cheese", "amanda", "summer", "love", "ashley", "6969", "nicole", "chelsea",
  "biteme", "matthew", "access", "yankees", "987654321", "dallas", "austin",
  "thunder", "taylor", "matrix", "mobilemail", "mom", "monitor", "monitoring",
  "montana", "moon", "moscow", "123abc", "1234qwer", "123456789a",
  "12345qwert", "123.com", "131211", "1password", "1q2w3e4r", "1qazxsw2",
  "2wsx3edc", "444444", "55555", "666888", "777888", "888888", "88888888",
  "999999", "987654", "a123456", "a123456789", "a1b2c3", "abcdef", "abcdefg",
  "abcdefgh", "abcd1234", "admin", "administrator", "adobe123", "airforce",
  "aloha", "angel", "animal", "anthony", "apple", "asdf", "asdfasdf",
  "asdfghjkl", "asdfg", "august", "baby", "banana", "bandit", "barney", "bass",
  "beaver", "benefit", "bigdog", "birds", "blahblah", "blessed", "blowfish",
  "bond007", "bonnie", "booboo", "booger", "boston", "brandon", "braves",
  "bronco", "brown", "bulldog", "butterfly", "caddy", "calvin", "camaro",
  "canada", "captain", "carter", "cat", "changeme", "chicken", "chris",
  "claudia", "cocacola", "codeman", "coffee", "college", "comein", "cookie",
  "corvette", "cowboy", "cricket", "catdog", "cyber", "dakota", "dallas1",
  "daniel1", "david", "debbie", "default", "dennis", "diablo", "diamond",
  "doctor", "dolphin", "donald", "donkey", "eagle", "eagle1",
]);

const EMAIL_LOCAL = /^[^@]+$/;

function base(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Returns a Mongolian error message when the password is unacceptable, or
 * null when it passes. Length is validated by Zod before this runs.
 */
export function passwordProblem(password: string, email: string, phone?: string): string | null {
  const value = base(password);
  const mail = base(email);
  if (COMMON_PASSWORDS.has(value)) {
    return "Энэ нууц үг хэт түгээмэл байна. Өөр нууц үг сонгоно уу";
  }
  if (mail && value === mail) return "Нууц үг и-мэйлтэйгээ ижил байж болохгүй";
  if (mail && EMAIL_LOCAL.test(mail) && value === mail.split("@")[0]) {
    return "Нууц үг и-мэйлтэйгээ ижил байж болохгүй";
  }
  if (phone && value === base(phone)) {
    return "Нууц үг утасны дугаартайгаа ижил байж болохгүй";
  }
  return null;
}

/** Hint only — never blocks. Shown under the field while typing. */
export function passwordStrengthHint(password: string): string | null {
  if (password.length < 8) return null;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((rule) =>
    rule.test(password),
  ).length;
  if (password.length >= 12 && classes >= 2) return "Хүчтэй нууц үг";
  if (classes >= 3) return "Сайн нууц үг";
  return "Урт, тоо, үсэг хольсон нууц үг илүү аюулгүй";
}
