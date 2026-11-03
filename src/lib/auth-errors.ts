const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Email atau password salah.",
  INVALID_EMAIL: "Format email tidak valid.",
  INVALID_PASSWORD: "Email atau password salah.",
  USER_ALREADY_EXISTS: "Email sudah terdaftar. Silakan login.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Email sudah terdaftar. Silakan login.",
  PASSWORD_TOO_SHORT: "Password minimal 8 karakter.",
  PASSWORD_TOO_LONG: "Password terlalu panjang.",
  INVALID_TOKEN: "Tautan reset tidak valid atau sudah kedaluwarsa. Minta tautan baru.",
};

export function authErrorMessage(error: { code?: string; status?: number } | null | undefined): string {
  if (!error) return "";
  if (error.status === 429) return "Terlalu banyak percobaan. Coba lagi sebentar lagi.";
  return (error.code && MESSAGES[error.code]) || "Terjadi kendala. Silakan coba lagi.";
}
