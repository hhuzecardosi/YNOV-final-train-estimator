import {
    AgeDiscountAmount,
    ApiException,
    DiscountCard,
    DiscountCardAmount,
    InvalidTripInputException,
    Passenger,
    TripDetails,
    TripRequest
} from "./model/trip.request";
import {ApiFacade} from "./external/api-facade";
import {SNCFTrenitaliaApiFacade} from "./external/sncf-api-facade";

type PassengerPrice = {passenger: Passenger, price: number};

export class TrainTicketEstimator {

    apiFacade: ApiFacade;

    constructor(apiFacade?: ApiFacade) {
        this.apiFacade = apiFacade || new SNCFTrenitaliaApiFacade()
    }

    checkExceptionFromTrainDetails(trainDetails: TripDetails): void {
        if (trainDetails.from.trim().length === 0) {
            throw new InvalidTripInputException("Start city is invalid");
        }

        if (trainDetails.to.trim().length === 0) {
            throw new InvalidTripInputException("Destination city is invalid");
        }

        const date = new Date();
        date.setHours(0, 0, 0, 0);
        if (trainDetails.when < date){
            throw new InvalidTripInputException("Date is invalid");
        }

    }

    async estimate(trainDetails: TripRequest): Promise<number> {
        if (trainDetails.passengers.length === 0) {
            return 0;
        }

        this.checkExceptionFromTrainDetails(trainDetails.details);

        // TODO USE THIS LINE AT THE END
        const apiPriceEstimation = await this.apiFacade.getPriceEstimation(trainDetails.details.from, trainDetails.details.to, trainDetails.details.when);

        if (apiPriceEstimation === -1) {
            throw new ApiException();
        }

        const passengers = trainDetails.passengers;

        const passengersPrices: PassengerPrice[] = [];

        for (let i=0;i<passengers.length;i++) {
            let priceForPassenger = apiPriceEstimation;
            priceForPassenger = this.computeAgeDiscount(passengers[i].age, apiPriceEstimation);

            if (passengers[i].age < 4) {
                passengersPrices.push({passenger: passengers[i], price: priceForPassenger});
                continue;
            }

            priceForPassenger += this.computeDateDiscount(trainDetails.details.when, apiPriceEstimation);

            passengersPrices.push({passenger: passengers[i], price: priceForPassenger});
        }

        const finalPassengersPrices = this.computeDiscountCardAmount(passengersPrices, apiPriceEstimation);

        return finalPassengersPrices.reduce((acc, passengerPrice) => acc + passengerPrice.price, 0);
    }

    private computeAgeDiscount(age: number, price: number): number {
        if (age < 0) { throw new InvalidTripInputException('Age is invalid')}
        if (age < 1) { return AgeDiscountAmount.LessThanOne }
        if (age <= 3) { return AgeDiscountAmount.LessThanThree }

        if (age <= 17) { return price * (1 - AgeDiscountAmount.LessThanEighteen)}
        if (age >= 70) { return price * (1 - AgeDiscountAmount.MoreThanSeventy)}

        return price * AgeDiscountAmount.Default;
    }

    private computeDateDiscount(dateDeparture: Date, apiPriceEstimation: number): number {
        const now = new Date();
        const thirtyDays = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30);
        const fiveDays = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5);
        const sixHours = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 6)

        const percentagePerDate = 0.02;
        const daysBeforePositivePercentage = 20;

        if (dateDeparture >= thirtyDays) {
            return apiPriceEstimation * -0.2
        }

        if(dateDeparture < thirtyDays && dateDeparture > fiveDays ) {
            const daysBeforeDeparture = Math.ceil((dateDeparture.getTime() - now.getTime()) / (1000 * 3600 * 24));
            return (daysBeforePositivePercentage - daysBeforeDeparture) * percentagePerDate * apiPriceEstimation;
        }

        if (dateDeparture <= sixHours) {
            return apiPriceEstimation * -0.2
        }
        return apiPriceEstimation;
    }

    private computeDiscountCardAmount(passengersPrices: PassengerPrice[], apiPriceEstimation: number): PassengerPrice[] {
        const result: PassengerPrice[] = passengersPrices
        result.forEach( passengerPrice => {
            if (passengerPrice.passenger.discounts.includes(DiscountCard.TrainStroke)) {
                passengerPrice.price = DiscountCardAmount.TrainStroke;
                return;
            }

            if (passengerPrice.passenger.age < 4) {
                return;
            }

            if(result.length === 1 && passengerPrice.passenger.age >= 18
              && passengerPrice.passenger.discounts.includes(DiscountCard.HalfCouple)){
                passengerPrice.price -= apiPriceEstimation * DiscountCardAmount.HalfCouple;
            }
            if (passengerPrice.passenger.age >= 70 && passengerPrice.passenger.discounts.includes(DiscountCard.Senior)) {
                passengerPrice.price -= apiPriceEstimation * DiscountCardAmount.Senior;
            }

            if (result.length === 2 && passengerPrice.passenger.age >= 18
              && passengersPrices.find(p => p.passenger.discounts.includes(DiscountCard.Couple)) !== undefined) {
                passengerPrice.price -= apiPriceEstimation * DiscountCardAmount.Couple;
            }
        });
        return result;
    }
}
