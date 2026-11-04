// Dibuat oleh scripts/build-wilayah.mjs; jangan disunting manual.
export type RawVillage = [kode: string, nama: string, kodepos: string];
export type RawDistrict = [kode: string, nama: string, villages: RawVillage[]];
export type RawRegency = [kode: string, nama: string, districts: RawDistrict[]];

export const provinces = [["11","Aceh"],["12","Sumatera Utara"],["13","Sumatera Barat"],["14","Riau"],["15","Jambi"],["16","Sumatera Selatan"],["17","Bengkulu"],["18","Lampung"],["19","Kepulauan Bangka Belitung"],["21","Kepulauan Riau"],["31","Daerah Khusus Ibukota Jakarta"],["32","Jawa Barat"],["33","Jawa Tengah"],["34","Daerah Istimewa Yogyakarta"],["35","Jawa Timur"],["36","Banten"],["51","Bali"],["52","Nusa Tenggara Barat"],["53","Nusa Tenggara Timur"],["61","Kalimantan Barat"],["62","Kalimantan Tengah"],["63","Kalimantan Selatan"],["64","Kalimantan Timur"],["65","Kalimantan Utara"],["71","Sulawesi Utara"],["72","Sulawesi Tengah"],["73","Sulawesi Selatan"],["74","Sulawesi Tenggara"],["75","Gorontalo"],["76","Sulawesi Barat"],["81","Maluku"],["82","Maluku Utara"],["91","Papua"],["92","Papua Barat"],["93","Papua Selatan"],["94","Papua Tengah"],["95","Papua Pegunungan"],["96","Papua Barat Daya"]] as [kode: string, nama: string][];

export const loaders: Record<string, () => Promise<{ default: RawRegency[] }>> = {
  "11": () => import("./11.json") as unknown as Promise<{ default: RawRegency[] }>,
  "12": () => import("./12.json") as unknown as Promise<{ default: RawRegency[] }>,
  "13": () => import("./13.json") as unknown as Promise<{ default: RawRegency[] }>,
  "14": () => import("./14.json") as unknown as Promise<{ default: RawRegency[] }>,
  "15": () => import("./15.json") as unknown as Promise<{ default: RawRegency[] }>,
  "16": () => import("./16.json") as unknown as Promise<{ default: RawRegency[] }>,
  "17": () => import("./17.json") as unknown as Promise<{ default: RawRegency[] }>,
  "18": () => import("./18.json") as unknown as Promise<{ default: RawRegency[] }>,
  "19": () => import("./19.json") as unknown as Promise<{ default: RawRegency[] }>,
  "21": () => import("./21.json") as unknown as Promise<{ default: RawRegency[] }>,
  "31": () => import("./31.json") as unknown as Promise<{ default: RawRegency[] }>,
  "32": () => import("./32.json") as unknown as Promise<{ default: RawRegency[] }>,
  "33": () => import("./33.json") as unknown as Promise<{ default: RawRegency[] }>,
  "34": () => import("./34.json") as unknown as Promise<{ default: RawRegency[] }>,
  "35": () => import("./35.json") as unknown as Promise<{ default: RawRegency[] }>,
  "36": () => import("./36.json") as unknown as Promise<{ default: RawRegency[] }>,
  "51": () => import("./51.json") as unknown as Promise<{ default: RawRegency[] }>,
  "52": () => import("./52.json") as unknown as Promise<{ default: RawRegency[] }>,
  "53": () => import("./53.json") as unknown as Promise<{ default: RawRegency[] }>,
  "61": () => import("./61.json") as unknown as Promise<{ default: RawRegency[] }>,
  "62": () => import("./62.json") as unknown as Promise<{ default: RawRegency[] }>,
  "63": () => import("./63.json") as unknown as Promise<{ default: RawRegency[] }>,
  "64": () => import("./64.json") as unknown as Promise<{ default: RawRegency[] }>,
  "65": () => import("./65.json") as unknown as Promise<{ default: RawRegency[] }>,
  "71": () => import("./71.json") as unknown as Promise<{ default: RawRegency[] }>,
  "72": () => import("./72.json") as unknown as Promise<{ default: RawRegency[] }>,
  "73": () => import("./73.json") as unknown as Promise<{ default: RawRegency[] }>,
  "74": () => import("./74.json") as unknown as Promise<{ default: RawRegency[] }>,
  "75": () => import("./75.json") as unknown as Promise<{ default: RawRegency[] }>,
  "76": () => import("./76.json") as unknown as Promise<{ default: RawRegency[] }>,
  "81": () => import("./81.json") as unknown as Promise<{ default: RawRegency[] }>,
  "82": () => import("./82.json") as unknown as Promise<{ default: RawRegency[] }>,
  "91": () => import("./91.json") as unknown as Promise<{ default: RawRegency[] }>,
  "92": () => import("./92.json") as unknown as Promise<{ default: RawRegency[] }>,
  "93": () => import("./93.json") as unknown as Promise<{ default: RawRegency[] }>,
  "94": () => import("./94.json") as unknown as Promise<{ default: RawRegency[] }>,
  "95": () => import("./95.json") as unknown as Promise<{ default: RawRegency[] }>,
  "96": () => import("./96.json") as unknown as Promise<{ default: RawRegency[] }>,
};
