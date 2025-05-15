import { apiRootQA } from "./commercetoolsQA/client";
import { argv } from "bun";
import type { Folios, ShipmentData } from "./interface/services.interface";
import { CreateFolios } from "./estafetaAPI/folios";

const orderNumber = argv[3]

const addFoliosOrders = async () => {
  console.log("Buscando orden")
  const order = await apiRootQA.orders().withOrderNumber({ orderNumber }).get().execute()
  if(!order.statusCode || order.statusCode >= 300)  {
    console.error("Hubo un error al recuperar la orden")
    return
  }
  if(!order.body) return console.error("Order not found")
  console.log("Orden encontrada")
  const services: ShipmentData = JSON.parse(order.body.custom?.fields["services"])
  console.log("Actualizando QRS")
  for(const keys of Object.keys(services)){
    const quantityGuides = services[keys].guides.length
    const folios = await CreateFolios(quantityGuides)
    if(!folios.data.success) return console.error("Folios no pudieron ser recuperados")
    const foliosResults: Folios[] = folios.data.folioResult
    for(const guides of services[keys].guides) {
      guides.QR = `Q3SQR${foliosResults[0].folioMD5}`
      foliosResults.shift()
    }
  }
  console.log("Qrs actualizados")
  console.log("Actualizando orden")
  await apiRootQA.orders().withOrderNumber({orderNumber}).post({
    body: {
      version: order.body.version,
      actions: [
        {
          action: "setCustomField",
          name: "services",
          value: JSON.stringify(services)
        }
      ]
    }
  }).execute()

  console.log("Completado")
}

const generatorFolios = async () => {
  try{
    const folios = await CreateFolios(parseInt(orderNumber))
    if(!folios.data.success) return console.error("Folios no pudieron ser recuperados")
    const foliosResults: Folios[] = folios.data.folioResult
    for(const folio of foliosResults) {
      console.log(`Q3SQR${folio.folioMD5}`)
    }
  } catch(err: any){
    console.log(err)
  }
}

const selectOption = () => {
  const option = parseInt(argv[2])
  switch (option){
    case 1: 
      addFoliosOrders()
    break;
    case 2:
      generatorFolios()
    break
  }
}

selectOption()
