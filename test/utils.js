// Utilites
export const getCookie = (res) => {
  const symbols = Object.getOwnPropertySymbols(res);
  const headersSymbol = symbols.find((symbol) => {
    return symbol.toString().includes("headers");
  });
  const headersList = res[headersSymbol];
  const headersListSymbols = Object.getOwnPropertySymbols(headersList);
  const headersMapSymbol = headersListSymbols.find((symbol) => {
    return !symbol.toString().includes("sorted");
  });
  const headersMap = headersList[headersMapSymbol];
  const cookieString = headersMap.get("set-cookie");
  const [cookie] = cookieString.split(";");
  return cookie;
};