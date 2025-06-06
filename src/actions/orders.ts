import { apiRootQA } from "../commercetoolsQA/client"

export const deleteOrderById = async (id: string) => {
  try {
    const order = await apiRootQA.orders().withId({ID: id}).get().execute()
    console.log("Orden encontrada")
    await apiRootQA.orders().withId({ID: id}).delete({
      queryArgs: {
        version: order.body.version
      }
    }).execute()
    console.log(`Orden eliminada`)
  } catch(_) {
    console.log("Orden no encontrada")
  }
}

export const deleteOrdersCustom = async() => {
  const ordersC = await apiRootQA.customObjects().withContainer({container: "orders"}).get({
    queryArgs: {
      limit: 500
    }
  }).execute()
  for(const order of ordersC.body.results) {
    await apiRootQA.customObjects().withContainerAndKey({
      container: "orders",
      key: order.key
    }).delete({
      queryArgs: {
        version: order.version
      }
    }).execute()
    console.log(`Order con key ${order.key} eliminado`)
  }
}

export const deleteOrdersByUser = async (email: string) => {
  const customer = await apiRootQA.customers().get({
    queryArgs: {
      where: `email in ("${email}")`
    }
  }).execute()

  const { id } = customer.body.results[0]

  const orders = await apiRootQA.orders().get({
    queryArgs: {
      where: `customerId in ("${id}")`
    }
  }).execute()

  for(const order of orders.body.results) {
    await apiRootQA.orders().withId({ID: order.id}).delete({
      queryArgs: {
        version: order.version
      }
    }).execute()

    console.log(`Orden con id ${order.id} eliminado`)
  }

}

export const deleteOrderTypeBundleEmptys = async (email: string) => {
  const customer = await apiRootQA.customers().get({
    queryArgs: {
      where: `email in ("${email}")`
    }
  }).execute()

  const { id } = customer.body.results[0]

  const orders = await apiRootQA.orders().get({
    queryArgs: {
      limit: 500,
      sort: "createdAt desc",
      where: `customerId in ("${id}") and custom(fields(type-order in ("bundle")))`
    }
  }).execute()

  for(const order of orders.body.results) {
    let services: any
    try {
      services = JSON.parse(order.custom?.fields["services"])
    } catch(_) {
      console.log(order.id)
      await apiRootQA.orders().withId({ID: order.id}).delete({
        queryArgs: {
          version: order.version
        }
      }).execute()
      console.log(`Order con id ${order.id} eliminado`)
      return
    }
    if(Object.keys(services).length <= 0) {
      console.log(order.id)
      await apiRootQA.orders().withId({ID: order.id}).delete({
        queryArgs: {
          version: order.version
        }
      }).execute()
      console.log(`Order con id ${order.id} eliminado`)
    } 
  }
}

export const deleteOrdersTypeCombo = async () => {
  const limit = 500;
  let offset = 0;
  let allOrders = [];
  let total = 10000;
  let done = false;

  do {
    const response = await apiRootQA.orders().get({
      queryArgs: {
        limit,
        offset,
        sort: "createdAt desc",
        where: `custom(fields(isCombo=true))`
      }
    }).execute();

    const { results, count } = response.body;
    allOrders.push(...results);
    offset += limit;

    if (offset >= total || offset >= 10000) {
      done = true;
    }
    console.log(offset)
  } while (!done);
  for(const order of allOrders) {
    await apiRootQA.orders().withId({ID: order.id}).delete({
      queryArgs: {
        version: order.version
      }
    }).execute()
    console.log(`Order with id ${order.id} deleted`)
  }
}




