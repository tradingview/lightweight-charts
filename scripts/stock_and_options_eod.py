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
from typing import List
import csv

def get_expirations(ticker: str) -> List[str]:
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


def get_strikes(ticker: str, expiration: str, current_price: float, strike_range: float = 0.05) -> List[str]:
    conn = http.client.HTTPConnection("127.0.0.1:25510")
    headers = { 'Accept': "application/json" }
    conn.request("GET", f"/v2/list/strikes?root={ticker}&exp={expiration}", headers=headers)
    res = conn.getresponse()
    data = res.read()
    data_json = json.loads(data.decode("utf-8"))
    # import pdb; pdb.set_trace()
    strikes = [float(strike) / 1000 for strike in data_json["response"]]
    # only use the strikes that are within 20% of the current day close price
    strikes = [strike for strike in strikes if strike >= current_price * (1 - strike_range) and strike <= current_price * (1 + strike_range)]
    conn.close()
    return strikes

def get_option_prices(ticker: str, strike: float, expiration: str) -> List[float]:
    conn = http.client.HTTPConnection("127.0.0.1:25510")
    headers = { 'Accept': "application/json" }
    # start and end date are current date
    start_date = datetime.now().strftime("%Y%m%d")
    end_date = datetime.now().strftime("%Y%m%d")
    conn.request("GET", f"/v2/hist/option/eod?exp={expiration}&right=C&strike={strike}&start_date={start_date}&end_date={end_date}&root={ticker}", headers=headers)
    res = conn.getresponse()
    data = res.read()
    data_json = json.loads(data.decode("utf-8"))['response']
    import pdb; pdb.set_trace()
    bid = [x[10] for x in data_json]
    ask = [x[14] for x in data_json]
    mid = [(bid[i] + ask[i]) / 2 for i in range(len(bid))]
    assert len(mid) == 1, "More than one price found for the option"
    return mid[0]

def get_stock_prices(ticker: str) -> List[float]:
    conn = http.client.HTTPConnection("127.0.0.1:25510")
    headers = { 'Accept': "application/json" }
    # start date is 20 days ago and end date is current date
    start_date = (datetime.now() - timedelta(days=20)).strftime("%Y%m%d")
    end_date = datetime.now().strftime("%Y%m%d")
    conn.request("GET", f"/v2/hist/stock/eod?root={ticker}&start_date={start_date}&end_date={end_date}", headers=headers)
    res = conn.getresponse()
    data = res.read()
    data_json = json.loads(data.decode("utf-8"))['response']
    return_data = []
    for x in data_json:
        import pdb; pdb.set_trace()
        open = x[2]
        high = x[3]
        low = x[4]
        close = x[5]
        cur_date = x[-1]
        return_data.append([cur_date, open, high, low, close])
    return return_data

if __name__ == "__main__":
    ticker = "AAPL"
    expirations = get_expirations(ticker)
    print(expirations)
    current_price = 222.5
    strikes = get_strikes(ticker, expirations[0], current_price)
    print(strikes)
    # for each strike, get the option prices for all the expirations
    data = []
    for strike in strikes:
        for expiration in expirations:
            option_closing_price = get_option_prices(ticker, strike, expiration)
            data.append([ticker, expiration, strike, option_closing_price])
    print(data)
    # export the data to a csv file
    base_path = f"/Users/aayushahuja/Documents/projects/optionx/dump"
    with open(f"{base_path}/{ticker}_options_eod_{datetime.now().strftime('%Y%m%d')}.csv", "w") as f:
        writer = csv.writer(f)
        writer.writerow(["ticker", "expiration", "strike", "option_closing_price"])
        writer.writerows(data)
    stock_data = get_stock_prices(ticker)
    with open(f"{base_path}/{ticker}_stock_eod_{datetime.now().strftime('%Y%m%d')}.csv", "w") as f:
        writer = csv.writer(f)
        writer.writerow(["date", "open", "high", "low", "close"])
        writer.writerows(stock_data)
