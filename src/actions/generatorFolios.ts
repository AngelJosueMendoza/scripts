import { CreateFolios } from "../estafetaAPI/folios";
import type { Folios } from "../interface/services.interface";

export const generatorFolios = async (orderNumber: string) => {
  try {
    const folios = await CreateFolios(parseInt(orderNumber));
    if (!folios.data.success)
      return console.error("Folios no pudieron ser recuperados");
    const foliosResults: Folios[] = folios.data.folioResult;
    for (const folio of foliosResults) {
      console.log(`Q3SQR${folio.folioMD5}`);
    }
  } catch (err: any) {
    console.log(err);
  }
};

export const nada = () => {};
