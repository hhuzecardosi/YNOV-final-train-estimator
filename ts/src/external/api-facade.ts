export interface ApiFacade {
  getPriceEstimation(from: string, to: string, when: Date): Promise<number | -1>;
}
