export class Passenger {
    constructor(readonly age: number, readonly discounts: DiscountCard[], readonly lastname?: string){}
}

export class TripRequest {
    constructor(readonly details: TripDetails, readonly passengers: Passenger[]){}
}

export class TripDetails {
    constructor(readonly from: string, readonly to: string, readonly when: Date) {
    }
}

export class InvalidTripInputException extends Error {
    constructor(message: string) {
        super(message);
    }
}

export class ApiException extends Error {
    constructor() {
        super("Api error");
    }
}

export enum DiscountCard {
    Senior = "Senior",
    TrainStroke= "TrainStroke",
    Couple = "Couple",
    HalfCouple = "HalfCouple",
    Family = "Family"
}

export enum DiscountCardAmount {
    Senior = 0.2,
    TrainStroke = 1,
    Couple = 0.2,
    HalfCouple = 0.1,
    Family = 0.3
}

export enum AgeDiscountAmount {
    LessThanOne = 0,
    LessThanThree = 9,
    LessThanEighteen = 0.4,
    MoreThanSeventy = 0.2,
    Default = 1.2
}
