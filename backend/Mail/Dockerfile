FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8083

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["Mail/Mail.csproj", "./"]
COPY ["SharedContracts/SharedContracts.csproj", "SharedContracts/"]
RUN dotnet restore

COPY . . 
COPY ["Mail/Templates", "Templates"]

RUN dotnet build "Mail/Mail.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Mail/Mail.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish . 
COPY --from=build /src/Templates Templates

ENTRYPOINT ["dotnet", "Mail.dll"]