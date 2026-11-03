-- Fitur ulasan pembeli dihapus (produk preloved jarang terjual berulang). Berhenti bila masih ada data ulasan.
DO $$
BEGIN
  IF (SELECT count(*) FROM "reviews") > 0 THEN
    RAISE EXCEPTION 'Tabel reviews masih berisi data; hapus manual bila memang tidak diperlukan.';
  END IF;
END $$;

DROP TABLE "reviews";
