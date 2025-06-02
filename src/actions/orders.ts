import { apiRootQA } from "../commercetoolsQA/client"

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
