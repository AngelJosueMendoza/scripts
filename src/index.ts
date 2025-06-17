import { apiRootQA } from "./commercetoolsQA/client";
import { argv } from "bun";
import type { Folios, ShipmentData } from "./interface/services.interface";
import { CreateFolios } from "./estafetaAPI/folios";
import { generatorFolios } from "./actions/generatorFolios";
import {
  readXlsxFile,
  updatedCustomUserByGuides,
} from "./actions/customersCountGuides";
import {
  deleteOrderById,
  deleteOrdersByUser,
  deleteOrdersCustom,
  deleteOrdersTypeCombo,
  deleteOrderTypeBundleEmptys,
} from "./actions/orders";
import { read } from "fs";
import path from "path";
import { backGuidesRecolections } from "./actions/recolections";
import { getGuidesByUser, updateUserGuides } from "./actions/users";

const orderNumber = argv[3];

const addFoliosOrders = async () => {
  console.log("Buscando orden");
  const order = await apiRootQA
    .orders()
    .withOrderNumber({ orderNumber })
    .get()
    .execute();
  if (!order.statusCode || order.statusCode >= 300) {
    console.error("Hubo un error al recuperar la orden");
    return;
  }
  if (!order.body) return console.error("Order not found");
  console.log("Orden encontrada");
  const services: ShipmentData = JSON.parse(
    order.body.custom?.fields["services"],
  );
  console.log("Actualizando QRS");
  for (const keys of Object.keys(services)) {
    const quantityGuides = services[keys].guides.length;

    const folios = await CreateFolios(quantityGuides);
    if (!folios.data.success)
      return console.error("Folios no pudieron ser recuperados");
    const foliosResults: Folios[] = folios.data.folioResult;
    for (const guides of services[keys].guides) {
      guides.QR = `Q3SQR${foliosResults[0].folioMD5}`;
      foliosResults.shift();
    }
  }
  console.log("Qrs actualizados");
  console.log("Actualizando orden");
  await apiRootQA
    .orders()
    .withOrderNumber({ orderNumber })
    .post({
      body: {
        version: order.body.version,
        actions: [
          {
            action: "setCustomField",
            name: "services",
            value: JSON.stringify(services),
          },
        ],
      },
    })
    .execute();

  console.log("Completado");
};

const validateQrs = async () => {
  try {
    const customerEmail = argv[2];
    const limitOrders = parseInt(argv[3]);
    const customer = await apiRootQA
      .customers()
      .get({
        queryArgs: {
          where: `email in ("${customerEmail}")`,
        },
      })
      .execute();
    const orders = await apiRootQA
      .orders()
      .get({
        queryArgs: {
          where: `customerId in ("${customer.body.results[0].id}")`,
          limit: limitOrders,
          sort: "createdAt desc",
        },
      })
      .execute();
    console.log(`Se encontraron ${orders.body.results.length} oirdenes`);
    if (!orders.statusCode || orders.statusCode >= 300)
      return console.error("No se encontraron ordenes");
    for (const order of orders.body.results) {
      const services: ShipmentData =
        order.custom?.fields["services"] &&
        JSON.parse(order.custom?.fields["services"]);
      if (!services) continue;
      for (const keys of Object.keys(services)) {
        let quantityGuides = 0;
        try {
          quantityGuides = services[keys].guides.length;
        } catch (err: any) {
          continue;
        }
        const qrs = services[keys].guides.find((item) => item.QR == "0");
        if (!qrs) continue;
        console.log("Cambiando qrs");
        const folios = await CreateFolios(quantityGuides);
        if (!folios.data.success)
          return console.error("Folios no pudieron ser recuperados");
        const foliosResults: Folios[] = folios.data.folioResult;
        for (const guides of services[keys].guides) {
          guides.QR = `Q3SQR${foliosResults[0].folioMD5}`;
          foliosResults.shift();
        }
      }
      console.log("Qrs actualizados");
      console.log("Actualizando orden");
      await apiRootQA
        .orders()
        .withId({ ID: order.id })
        .post({
          body: {
            version: order.version,
            actions: [
              {
                action: "setCustomField",
                name: "services",
                value: JSON.stringify(services),
              },
            ],
          },
        })
        .execute();
      console.log(`Orden con id ${order.id} actualizado`);
      console.log("------------------------------------");
    }
  } catch (err: any) {
    console.log(err);
  }
};

const selectOption = () => {
  const option = parseInt(argv[2]);
  switch (option) {
    case 1:
      addFoliosOrders();
      break;
    case 2:
      generatorFolios(orderNumber);
      break;
  }
};

const updatedUsers = async () => {
  const file = "./customers.xlsx";
  const filePath = path.resolve(file);
  const readFile = await readXlsxFile(filePath);
  for (const customers of readFile) {
    //console.log(customers["mordoneza@amda.mx"])
    //await updatedCustomUserByGuides(customers["mordoneza@amda.mx"])
    //@ts-ignore
    console.log(customers["179aab26-c89d-4fcc-949e-80ac540872d4"]);
    //await deleteOrderById(customers["179aab26-c89d-4fcc-949e-80ac540872d4"])
  }
};

updatedCustomUserByGuides("mala_aline@hotmail.com");
