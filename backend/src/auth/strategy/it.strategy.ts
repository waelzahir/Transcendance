import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtPayload } from "../types";
import { Request as RequestType } from "express";

@Injectable()
export class ItStrategy extends PassportStrategy(Strategy, "jwt-intra") {
	constructor(config: ConfigService) {
		super({
			jwtFromRequest: ExtractJwt.fromExtractors([
				ItStrategy.extractJWT,
				// ExtractJwt.fromAuthHeaderAsBearerToken(),
			]),
			secretOrKey: config.get<string>("IT_SECRET"),
		});
	}

	private static extractJWT(req: RequestType | any): string | null {
		if (req.cookies && "itToken" in req.cookies && req.cookies.itToken?.length > 0) {
			return req.cookies.itToken;
		}
		if (
			req.request &&
			req.request.headers.cookie &&
			req.request.headers.cookie.search("itToken") != -1 &&
			req.request.headers.cookie.length > 0
		) {
			const on = req.request.headers.cookie.split("; ")[0].replace("=", ":");
			return on.split(":")[1];
		}
		throw new UnauthorizedException();
		return null;
	}

	validate(payload: JwtPayload) {
		return payload;
	}
}
