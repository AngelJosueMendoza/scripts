import type { Order } from "@commercetools/platform-sdk";
import { apiRootQA } from "../commercetoolsQA/client";
import { updatedCustomUserByGuides } from "./customersCountGuides";

export const updateUserGuides = async () => {
  const limit = 500;
  let offset = 0;
  let allUsers = [];
  let total = 10000;
  let done = false;

  do {
    const response = await apiRootQA
      .customers()
      .get({
        queryArgs: {
          limit,
          offset,
          sort: "createdAt desc",
        },
      })
      .execute();

    const { results, count } = response.body;
    allUsers.push(...results);
    offset += limit;

    if (offset >= total || offset >= 10000) {
      done = true;
    }
    console.log(offset);
  } while (!done);

  for (const user of allUsers) {
    await updatedCustomUserByGuides(user.email);
  }
};

export const getGuidesByUser = async (email: string) => {
  const user = await apiRootQA
    .customers()
    .get({
      queryArgs: {
        where: `email in ("${email}")`,
      },
    })
    .execute();
  if (!user.statusCode || user.statusCode >= 300)
    return console.error("Usuario no encontrado");
  let orders: Order[] = [];
  const getOrders = await apiRootQA
    .orders()
    .get({
      queryArgs: {
        where: `customerId in ("${user.body.results[0].id}")`,
      },
    })
    .execute();
  const ordersCustom = await apiRootQA
    .customObjects()
    .withContainer({ container: "orders" })
    .get({
      queryArgs: {
        where: `value (user in ("${user.body.results[0].id}"))`,
      },
    })
    .execute();
  orders = [
    ...getOrders.body.results,
    ...ordersCustom.body.results.map((item) => item.value),
  ];
  const services = [];
  for (const order of orders) {
    const parseServices =
      order.custom?.fields["services"] &&
      JSON.parse(order.custom.fields["services"]);
    if (!parseServices) continue;
    console.log(parseServices);
    for (const keys of Object.keys(parseServices)) {
      services.push(parseServices?.[keys]?.guides) ?? parseServices[keys];
    }
  }
  console.table(services);
};
