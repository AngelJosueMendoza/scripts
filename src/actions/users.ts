import { apiRootQA } from "../commercetoolsQA/client";
import { updatedCustomUserByGuides } from "./customersCountGuides";

export const updateUserGuides = async () => {
  const limit = 500;
  let offset = 0;
  let allUsers = [];
  let total = 10000;
  let done = false;

  do {
    const response = await apiRootQA.customers().get({
      queryArgs: {
        limit,
        offset,
        sort: "createdAt desc",
      }
    }).execute();

    const { results, count } = response.body;
    allUsers.push(...results);
    offset += limit;

    if (offset >= total || offset >= 10000) {
      done = true;
    }
    console.log(offset)
  } while (!done);
 
  for(const user of allUsers) {
    await updatedCustomUserByGuides(user.email)
  }
}
