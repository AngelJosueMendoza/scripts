import axios from "axios";
import { authToken } from "./auth";

export const CreateFolios = async (quantityFolios: number) => {
  const token = await authToken({ type: 'folios' })

  let data = JSON.stringify({
    "applicationName": "TiendaEstafeta",
    "validityTime": "24", // dado por horas
    "format": "TDA-%06d", /// fiexd prefix Q3SQR
    "count": quantityFolios
  });

  const config = {
    method: 'post',
    url: process.env.URL_FOLIOS ?? "",
    headers: { 
      'apikey': process.env.API_KEY_FOLIOS, 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}`, 
    },
    data : data
  };

  try {
    const response = await axios.request(config);
    console.log(JSON.stringify(response.data))
    return {
      data: response.data,
      message: undefined,
    }
  } catch (error: any) {
    console.error(error)
    return {
      data: "",
      message: error.message
    }
  }
}
