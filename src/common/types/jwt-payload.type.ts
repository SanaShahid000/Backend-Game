export type JwtPayload = {
  sub: string;
  email: string;
  lastLogoutAt: string | null;
};
