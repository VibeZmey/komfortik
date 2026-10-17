FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8084

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["BoardingPasses/BoardingPasses.csproj", "./"]
COPY ["SharedContracts/SharedContracts.csproj", "SharedContracts/"]
RUN dotnet restore

COPY . . 
COPY ["BoardingPasses/code", "code"]

RUN dotnet build "BoardingPasses/BoardingPasses.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "BoardingPasses/BoardingPasses.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish . 
COPY --from=build /src/code code

ENTRYPOINT ["dotnet", "BoardingPasses.dll"]