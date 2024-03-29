import { Catch, ExecutionContext, Injectable, UnauthorizedException, UseFilters } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { Response } from "express";

@Injectable()
export class AtGuard extends AuthGuard("jwt") {
	constructor(private reflector: Reflector) {
		super();
	}

	canActivate(context: ExecutionContext) {
		const isPublic = this.reflector.getAllAndOverride("isPublic", [context.getHandler(), context.getClass()]);
		if (isPublic) return true;
		const req = context.switchToHttp().getRequest();
		if (  context.getType() === "ws" &&  req.request.headers.pass)
		{
			return true;
		}
		if (
			(req.cookies && "atToken" in req.cookies && req.cookies.atToken?.length > 0) ||
			(req.request &&
				req.request.headers.cookie &&
				req.request.headers.cookie.search("atToken") != -1 &&
				req.request.headers.cookie.length > 0)
		) {
			return super.canActivate(context);
		}
		return false;
	}
}
