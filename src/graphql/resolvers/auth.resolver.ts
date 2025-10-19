import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthPayloadType } from '../types/auth.type';
import { UserType } from '../types/user.type';
import { LoginInput } from '../inputs/login.input';
import { RegisterInput } from '../inputs/register.input';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => AuthPayloadType, { name: 'login' })
  async login(@Args('input') input: LoginInput) {
    return this.authService.login({
      identifier: input.identifier,
      password: input.password,
    });
  }

  @Mutation(() => AuthPayloadType, { name: 'register' })
  async register(@Args('input') input: RegisterInput) {
    return this.authService.register(input);
  }

  @Query(() => UserType, { name: 'me' })
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: { id: string }) {
    return this.authService.getMe(user.id);
  }

  @Mutation(() => Boolean, { name: 'logout' })
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: { id: string }) {
    await this.authService.logout(user.id);
    return true;
  }
}
