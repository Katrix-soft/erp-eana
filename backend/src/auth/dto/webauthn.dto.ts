export class WebAuthnRegisterOptionsDto {
    userId: number;
}

export class WebAuthnVerifyRegistrationDto {
    userId: number;
    response: any; // RegistrationResponseJSON from client
}

export class WebAuthnAuthOptionsDto {
    userId: number;
}

export class WebAuthnVerifyAuthDto {
    userId: number;
    response: any; // AuthenticationResponseJSON from client
}
