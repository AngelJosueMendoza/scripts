import type { Order } from "@commercetools/platform-sdk";
import { apiRootQA } from "../commercetoolsQA/client";
import type { Shipment } from "../interface/guiaItem.interface";

export const backGuidesRecolections = async (orderNumber: string) => {
  try {
    if (orderNumber == "") return;
    let orden;
    debugger;
    orden = await apiRootQA
      .orders()
      .withOrderNumber({ orderNumber })
      .get()
      .execute();

    for (const item of orden.body.lineItems) {
      const guides: Shipment[] = JSON.parse(item.custom?.fields["guia"]);
      console.log(guides);

      for (const guide of guides) {
        let searchOrden: Order = {} as Order;
        let qr = "";
        let user = "";

        try {
          const order = await apiRootQA
            .orders()
            .withOrderNumber({ orderNumber: guide.orderNumberLast })
            .get()
            .execute();
          searchOrden = order.body;
        } catch (err: any) {
          try {
            const order = await apiRootQA
              .orders()
              .withId({ ID: guides[0].orderNumberLast })
              .get()
              .execute();
            searchOrden = order.body;
          } catch (_) {
            const order = await apiRootQA
              .customObjects()
              .get({
                queryArgs: {
                  where: `value (idOrden in ("${guide.orderNumberLast}"))`,
                },
              })
              .execute();
            searchOrden = order.body.results[0].value.order;
            qr = order.body.results[0].value.qr;
            user = order.body.results[0].value.user;
          }
        }

        const serviceCustomSearch = JSON.parse(
          searchOrden.custom?.fields["services"],
        );
        const { id, orderNumberLast, ...rest } = guide;
        const { recoleccion, ...addressRest } = rest.address || {};
        console.log(serviceCustomSearch[guide.id]);

        console.log(item.custom?.fields);

        const searchItem = searchOrden.lineItems.find(
          (item) => item.id == guide.id,
        );
        if (!searchItem) return console.error("Item not found");

        serviceCustomSearch[guide.id].guides = [
          {
            guide: guide.guia,
            trackingCode: guide.trackingCode,
            QR: guide.qr,
            isItemDimensionsExceeded:
              searchItem?.custom?.fields["isItemDimensionsExceeded"] ?? "",
            isItemWeightExceeded:
              searchItem.custom?.fields["isItemWeightExceeded"],
            isPackage: searchItem.custom?.fields["isPackage"],
            isPudo: searchItem.custom?.fields["isPudo"],
            itemHeight: searchItem.custom?.fields["itemHeight"],
            itemLength: searchItem.custom?.fields["itemLength"],
            itemVolumen: searchItem.custom?.fields["itemVolumen"],
            itemWeight: searchItem.custom?.fields["itemWeight"],
            itemWidth: searchItem.custom?.fields["itemWidth"],
            recoleccion: searchItem.custom?.fields["recoleccion"],
            address: {
              origin: addressRest.origin,
              destination: addressRest.destination,
            },
            qrStatus: "active",
            validityDays: 15,
            validityDate: searchOrden.createdAt,
            renovationDate: null,
            renovationEndDate: null,
            updatedAddress: false,
          },
        ];

        console.log(serviceCustomSearch[guide.id].guides);

        try {
          await apiRootQA
            .orders()
            .withId({ ID: searchOrden.id })
            .post({
              body: {
                version: searchOrden.version,
                actions: [
                  {
                    action: "setCustomField",
                    name: "services",
                    value: JSON.stringify(serviceCustomSearch),
                  },
                ],
              },
            })
            .execute();
        } catch (_) {
          const orderN: Order = {
            ...searchOrden,
            custom: {
              type: {
                id: searchOrden.custom?.type.id ?? "",
                typeId: "type",
              },
              fields: {
                ...searchOrden.custom?.fields,
                services: JSON.stringify(serviceCustomSearch),
              },
            },
          };

          const order = await apiRootQA
            .customObjects()
            .get({
              queryArgs: {
                where: `value (idOrden in ("${guide.orderNumberLast}"))`,
              },
            })
            .execute();

          for (const orden of order.body.results) {
            const customObjectOrder = await apiRootQA
              .customObjects()
              .post({
                body: {
                  container: "orders",
                  key: orden.value.qr,
                  value: {
                    order: orderN,
                    qr: orden.value.qr,
                    user: orden.value.user,
                    idOrden: orden.value.idOrden,
                  },
                },
              })
              .execute();
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in backGuidesRecolections:", error);
    throw error;
  }
};
