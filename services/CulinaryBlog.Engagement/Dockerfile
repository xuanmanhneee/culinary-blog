FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY services/CulinaryBlog.Engagement/CulinaryBlog.Engagement.csproj services/CulinaryBlog.Engagement/
RUN dotnet restore services/CulinaryBlog.Engagement/CulinaryBlog.Engagement.csproj
COPY services/CulinaryBlog.Engagement/ services/CulinaryBlog.Engagement/
RUN dotnet publish services/CulinaryBlog.Engagement/CulinaryBlog.Engagement.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "CulinaryBlog.Engagement.dll"]
