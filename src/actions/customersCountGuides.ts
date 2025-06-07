import type { CustomerUpdateAction } from "@commercetools/platform-sdk";
import { apiRootQA } from "../commercetoolsQA/client";

import * as XLSX from "xlsx";
import { readFile } from "fs/promises";

export async function readXlsxFile(filePath: string) {
  try {
    const fileBuffer = await readFile(filePath);
    const workbook = XLSX.read(fileBuffer);
    const sheetNames = workbook.SheetNames;
    const firstSheetName = sheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    return jsonData;
  } catch (error) {
    console.error("Error al leer el archivo XLSX:", error);
    throw error;
  }
}

export const updatedCustomUserByGuides = async (email: string) => {
  const customer = await apiRootQA
    .customers()
    .get({
      queryArgs: {
        where: `email in ("${email}")`,
      },
    })
    .execute();

  if (!customer.statusCode || customer.statusCode >= 300)
    return console.log("Usuario no encontrado");
  if (customer.body.results.length <= 0)
    return console.log("Usuario no encontrado");

  const { id, version } = customer.body.results[0];

  const orders = await apiRootQA
    .orders()
    .get({
      queryArgs: {
        limit: 500,
        where: `customerId in ("${id}") and custom(fields(isCombo in (true)))`,
      },
    })
    .execute();

  if (!orders.statusCode || orders.statusCode >= 300)
    return console.log("No hay ordenes para este usuario");
  if (orders.body.results.length <= 0)
    return console.log("No hay ordenes para este usuario");

  const mapCount = new Map();
  mapCount.set("Dia Siguiente-legacy", 0);
  mapCount.set("Terrestre-legacy", 0);
  mapCount.set("TERRESTRE", 0);
  mapCount.set("DIA SIGUIENTE", 0);
  mapCount.set("DOS DIAS", 0);
  mapCount.set("12:30", 0);
  for (const order of orders.body.results) {
    const services =
      order.custom?.fields["services"] &&
      JSON.parse(order.custom?.fields["services"]);
    if (!services) return console.log("No hay info");
    console.log(order.orderNumber);
    for (const item of order.lineItems) {
      if (!services[item.id]) continue;
      const { guides } = services[item.id];
      if (guides.length <= 0) continue;
      console.log(guides.length);
      let name = item.name?.["es"]
        ? `${item.name["es"]}-legacy`
        : item.variant.attributes?.[0]?.value["label"];
      if (!mapCount.get(name)) {
        mapCount.set(name, guides.length);
      } else {
        const value = mapCount.get(name);
        mapCount.set(name, value + guides.length);
      }
    }
  }

  console.table(mapCount);
  const actions: CustomerUpdateAction[] = [];

  for (const [clave, value] of mapCount) {
    switch (clave) {
      case "Día Siguiente-legacy":
        actions.push({
          action: "setCustomField",
          name: "quantity-guides-dia-siguiente-legacy",
          value: value.toString(),
        });
        break;
      case "Terrestre-legacy":
        actions.push({
          action: "setCustomField",
          name: "quantity-guides-terrestres-legacy",
          value: value.toString(),
        });
        break;
      case "TERRESTRE":
        actions.push({
          action: "setCustomField",
          name: "quantity-guides-terrestres",
          value: value,
        });
        break;
      case "DIA SIGUIENTE":
        actions.push({
          action: "setCustomField",
          name: "quantity-guides-dia-siguiente",
          value: value,
        });
        break;
      case "DOS DIAS":
        actions.push({
          action: "setCustomField",
          name: "quantity-guides-dos-dias",
          value: value,
        });
        break;
      case "12:30":
        actions.push({
          action: "setCustomField",
          name: "quantity-guides-doce-treinta",
          value: value,
        });
        break;
    }
  }

  await apiRootQA
    .customers()
    .withId({ ID: id })
    .post({
      body: {
        version: version,
        actions,
      },
    })
    .execute();

  console.log("Proceso completado");
};
