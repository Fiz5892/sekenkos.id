// Supabase memakai CA sendiri. Unduh sertifikatnya dari dashboard (Project Settings > Database >
// SSL Configuration) lalu isi DATABASE_CA dengan isi PEM-nya; baris baru boleh ditulis sebagai \n.
export function databaseSsl() {
  const ca = process.env.DATABASE_CA?.replace(/\n/g, "\n");
  return ca ? { ca } : undefined;
}
