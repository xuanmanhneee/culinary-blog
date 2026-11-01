FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY backend/src/CulinaryBlog.Domain/CulinaryBlog.Domain.csproj backend/src/CulinaryBlog.Domain/
COPY backend/src/CulinaryBlog.Application/CulinaryBlog.Application.csproj backend/src/CulinaryBlog.Application/
COPY backend/src/CulinaryBlog.Infrastructure/CulinaryBlog.Infrastructure.csproj backend/src/CulinaryBlog.Infrastructure/
COPY backend/src/CulinaryBlog.API/CulinaryBlog.API.csproj backend/src/CulinaryBlog.API/
RUN dotnet restore backend/src/CulinaryBlog.API/CulinaryBlog.API.csproj
COPY backend/src/ backend/src/
RUN dotnet publish backend/src/CulinaryBlog.API/CulinaryBlog.API.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "CulinaryBlog.API.dll"]
