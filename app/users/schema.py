import graphene
from graphene_django import DjangoObjectType
from graphql import GraphQLError
from django.contrib.auth.models import User


class UserType(DjangoObjectType):
    class Meta:
        model = User


class Query(graphene.ObjectType):
    user = graphene.Field(UserType, id=graphene.Int(required=True))
    me = graphene.Field(UserType)

    def resolve_user(self, info, id):
        return User.objects.get(id=id)

    def resolve_me(self, info):
        user = info.context.user
        if user.is_anonymous:
            raise GraphQLError("Not loged in!")
        return user


class CreateUser(graphene.Mutation):
    user = graphene.Field(UserType)

    class Arguments:
        username = graphene.String(required=True)
        email = graphene.String(required=True)
        password = graphene.String(required=True)

    def mutate(self, info, username, email, password):
        user = User(username=username, email=email)
        user.set_password(password)
        user.save()
        return CreateUser(user)


class Mutation(graphene.ObjectType):
    create_user = CreateUser.Field()
