import {
    AgeDiscountAmount,
    ApiException,
    DiscountCard, DiscountCardAmount,
    InvalidTripInputException,
    TripDetails,
    TripRequest
} from "./model/trip.request";
import {ApiFacade} from "./external/api-facade";
import {SNCFTrenitaliaApiFacade} from "./external/sncf-api-facade";

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
        let tot = 0;

        for (let i=0;i<passengers.length;i++) {
            let priceForPassenger = apiPriceEstimation;
            priceForPassenger = this.computeAgeDiscount(passengers[i].age, apiPriceEstimation);

            if(passengers[i].age >= 70 && passengers[i].discounts.includes(DiscountCard.Senior)) {
                priceForPassenger -= apiPriceEstimation * DiscountCardAmount.Senior;
            }

            if (passengers[i].age < 4) {
                tot += priceForPassenger;
                continue;
            }

            priceForPassenger += this.computeDateDiscount(trainDetails.details.when, apiPriceEstimation);

            if (passengers[i].discounts.includes(DiscountCard.TrainStroke)) {
                priceForPassenger = 1;
            }

            tot += priceForPassenger;
        }

        if (passengers.length == 2) {
            let cp = false;
            let mn = false;
            for (let i=0;i<passengers.length;i++) {
                if (passengers[i].discounts.includes(DiscountCard.Couple)) {
                    cp = true;
                }
                if (passengers[i].age < 18) {
                    mn = true;
                }
            }
            if (cp && !mn) {
                tot -= apiPriceEstimation * 0.2 * 2;
            }
        }

        if (passengers.length == 1) {
            let cp = false;
            let mn = false;
            for (let i=0;i<passengers.length;i++) {
                if (passengers[i].discounts.includes(DiscountCard.HalfCouple)) {
                    cp = true;
                }
                if (passengers[i].age < 18) {
                    mn = true;
                }
            }
            if (cp && !mn) {
                tot -= apiPriceEstimation * 0.1;
            }
        }

        return tot;
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

        const percentagePerDate = 0.02;
        const daysBeforePositivePercentage = 20;

        if (dateDeparture >= thirtyDays) {
            return apiPriceEstimation * -0.2
        }

        if(dateDeparture < thirtyDays && dateDeparture > fiveDays ) {
            const daysBeforeDeparture = Math.ceil((dateDeparture.getTime() - now.getTime()) / (1000 * 3600 * 24));
            return (daysBeforePositivePercentage - daysBeforeDeparture) * percentagePerDate * apiPriceEstimation;
        }

        return apiPriceEstimation;
    }
}
