import {ApiFacade} from "./api-facade";

export class SNCFTrenitaliaApiFacade implements ApiFacade {
  async getPriceEstimation(from: string, to: string, when: Date): Promise<number | -1> {
    return (await(await fetch(`https://sncftrenitaliadb.com/api/train/estimate/price?from=${from}&to=${to}&date=${when}`)).json())?.price || -1;
  }
}
