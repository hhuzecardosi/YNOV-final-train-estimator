import {ApiException, DiscountCard, InvalidTripInputException, TripRequest} from "./model/trip.request";
import {ApiFacade} from "./external/api-facade";
import {SNCFTrenitaliaApiFacade} from "./external/sncf-api-facade";

export class TrainTicketEstimator {

    apiFacade: ApiFacade;

    constructor(apiFacade?: ApiFacade) {
        this.apiFacade = apiFacade || new SNCFTrenitaliaApiFacade()
    }

    async estimate(trainDetails: TripRequest): Promise<number> {
        if (trainDetails.passengers.length === 0) {
            return 0;
        }

        if (trainDetails.details.from.trim().length === 0) {
            throw new InvalidTripInputException("Start city is invalid");
        }

        if (trainDetails.details.to.trim().length === 0) {
            throw new InvalidTripInputException("Destination city is invalid");
        }

        if (trainDetails.details.when < new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 0, 0, 0)) {
            throw new InvalidTripInputException("Date is invalid");
        }

        // TODO USE THIS LINE AT THE END
        const apiPriceEstimation = await this.apiFacade.getPriceEstimation(trainDetails.details.from, trainDetails.details.to, trainDetails.details.when);

        if (apiPriceEstimation === -1) {
            throw new ApiException();
        }

        const pasngers = trainDetails.passengers;
        let tot = 0;
        let tmp = apiPriceEstimation;
        for (let i=0;i<pasngers.length;i++) {

            if (pasngers[i].age < 0) {
                throw new InvalidTripInputException("Age is invalid");
            }
            if (pasngers[i].age < 1) {
                continue;
            }
            // Seniors
            else if (pasngers[i].age <= 17) {
            tmp = apiPriceEstimation* 0.6;
            } else if(pasngers[i].age >= 70) {
                tmp = apiPriceEstimation * 0.8;
                if (pasngers[i].discounts.includes(DiscountCard.Senior)) {
                    tmp -= apiPriceEstimation * 0.2;
                }
            } else {
                tmp = apiPriceEstimation*1.2;
            }

            const d = new Date();
            if (trainDetails.details.when.getTime() >= d.setDate(d.getDate() +30)) {
                tmp -= apiPriceEstimation * 0.2;
            } else if (trainDetails.details.when.getTime() > d.setDate(d.getDate() -30 + 5)) {
                const date1 = trainDetails.details.when;
                const date2 = new Date();
                //https://stackoverflow.com/questions/43735678/typescript-get-difference-between-two-dates-in-days
                var diff = Math.abs(date1.getTime() - date2.getTime());
                var diffDays = Math.ceil(diff / (1000 * 3600 * 24));

                tmp += (20 - diffDays) * 0.02 * apiPriceEstimation; // I tried. it works. I don't know why.
            } else {
                tmp += apiPriceEstimation;
            }

            if (pasngers[i].age > 0 && pasngers[i].age < 4) {
                tmp = 9;
            }

            if (pasngers[i].discounts.includes(DiscountCard.TrainStroke)) {
                tmp = 1;
            }

            tot += tmp;
            tmp = apiPriceEstimation;
        }

        if (pasngers.length == 2) {
            let cp = false;
            let mn = false;
            for (let i=0;i<pasngers.length;i++) {
                if (pasngers[i].discounts.includes(DiscountCard.Couple)) {
                    cp = true;
                }
                if (pasngers[i].age < 18) {
                    mn = true;
                }
            }
            if (cp && !mn) {
                tot -= apiPriceEstimation * 0.2 * 2;
            }
        }

        if (pasngers.length == 1) {
            let cp = false;
            let mn = false;
            for (let i=0;i<pasngers.length;i++) {
                if (pasngers[i].discounts.includes(DiscountCard.HalfCouple)) {
                    cp = true;
                }
                if (pasngers[i].age < 18) {
                    mn = true;
                }
            }
            if (cp && !mn) {
                tot -= apiPriceEstimation * 0.1;
            }
        }

        return tot;
    }
}
