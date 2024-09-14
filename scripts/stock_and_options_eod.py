"""
this script is used to get the stock and options data from thetadata api
the input will be one ticker, the script has to do the following:

1. Use the EOF api and get the data for the ticker for the last 20 days
2. Use the List Expirations api and get the list of expirations for the ticker for the next 3 months
3. For each expiration, get the list of strikes using the List Strikes api
4. Use only the strikes which are within 20% of the current day close price
5. For those strikes and expirations, get the option prices using the Get Option Price api
6. export the data to a csv file

Sample code snippets are:

List Expirations api:
    import http.client

    conn = http.client.HTTPConnection("127.0.0.1:25510")

    headers = { 'Accept': "application/json" }

    conn.request("GET", "/v2/list/expirations?root=AAPL", headers=headers)

    res = conn.getresponse()
    data = res.read()

    print(data.decode("utf-8"))

List Strikes api:
    import http.client

    conn = http.client.HTTPConnection("127.0.0.1:25510")

    headers = { 'Accept': "application/json" }

    conn.request("GET", "/v2/list/strikes?root=AAPL&exp=20240927", headers=headers)

    res = conn.getresponse()
    data = res.read()

    print(data.decode("utf-8"))

Get Option Price api:
    expiration = '20240927'
    strike = '227500'
    start_date = '20240909'
    end_date = '20240913'
    import http.client

    conn = http.client.HTTPConnection("127.0.0.1:25510")

    headers = { 'Accept': "application/json" }

    conn.request("GET", f'/v2/hist/option/eod?exp={expiration}&right=C&strike={strike}&start_date={start_date}&end_date={end_date}&root=AAPL', headers=headers)

    res = conn.getresponse()
    data = res.read()

    print(data.decode("utf-8"))

Stock EOD api:
    import http.client

    start_date = '20240909'
    end_date = '20240913'

    conn = http.client.HTTPConnection("127.0.0.1:25510")

    headers = { 'Accept': "application/json" }

    conn.request("GET", f"/v2/hist/stock/eod?root=AAPL&start_date={start_date}&end_date={end_date}", headers=headers)

    res = conn.getresponse()
    data = res.read()

    print(data.decode("utf-8"))
"""

import http.client
import json
from datetime import datetime, timedelta

def get_expirations(ticker: str) -> list[str]:
    conn = http.client.HTTPConnection("127.0.0.1:25510")
    headers = { 'Accept': "application/json" }
    conn.request("GET", f"/v2/list/expirations?root={ticker}", headers=headers)
    res = conn.getresponse()
    data = res.read()
    data_json = json.loads(data.decode("utf-8"))
    expirations = [str(exp) for exp in data_json["response"]]
    # only use the expirations that are in the future and only for the next 3 months sorted by increasing order
    expirations = [exp for exp in expirations if datetime.strptime(exp, "%Y%m%d") > datetime.now() and datetime.strptime(exp, "%Y%m%d") < datetime.now() + timedelta(days=90)]
    expirations.sort(key=lambda x: datetime.strptime(x, "%Y%m%d"))
    conn.close()
    return expirations

if __name__ == "__main__":
    expirations = get_expirations("AAPL")
    print(expirations)