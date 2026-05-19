// Dane firmy
export const COMPANY = {
  name: "TAXIGO Paweł Kukla",
  shortName: "TAXIGO",
  nip: "9441419164",
  address: "ul. Tymotkowa 16, 30-382 Kraków",
  email: "pkukla35@gmail.com",
  phone: "881 208 313",
  phoneIntl: "+48 881 208 313",
};

export const PRIVACY_POLICY_UPDATED = "19 maja 2026";
export const TERMS_UPDATED = "19 maja 2026";

export const PRIVACY_POLICY = `
**1. ADMINISTRATOR DANYCH OSOBOWYCH**

Administratorem Twoich danych osobowych jest:

**${COMPANY.name}**
${COMPANY.address}
NIP: ${COMPANY.nip}
E-mail: ${COMPANY.email}
Telefon: ${COMPANY.phoneIntl}

Możesz się z nami skontaktować w każdej sprawie dotyczącej Twoich danych osobowych pisemnie, telefonicznie lub mailowo.


**2. JAKIE DANE PRZETWARZAMY?**

Przetwarzamy następujące Twoje dane osobowe:
• imię i nazwisko,
• adres e-mail,
• numer telefonu,
• adres odbioru (np. hotel, mieszkanie),
• dane dotyczące rezerwacji (data, liczba osób, wybrana wycieczka),
• dane geolokalizacyjne (tylko gdy zamawiasz przewóz TAXI i wyrazisz zgodę),
• dane płatnicze (zaszyfrowane, obsługiwane przez Stripe – nie przechowujemy numerów kart),
• dane techniczne (typ urządzenia, system operacyjny, identyfikator powiadomień push).


**3. W JAKIM CELU PRZETWARZAMY TWOJE DANE?**

Twoje dane przetwarzamy w celu:
a) realizacji umowy o świadczenie usług przewozowych i turystycznych — podstawa: art. 6 ust. 1 lit. b RODO,
b) realizacji obowiązków podatkowych i księgowych (np. wystawianie rachunków/faktur) — podstawa: art. 6 ust. 1 lit. c RODO,
c) kontaktu z Tobą w sprawie rezerwacji (telefon, e-mail, SMS, push) — podstawa: art. 6 ust. 1 lit. b RODO,
d) obsługi reklamacji i zwrotów — podstawa: art. 6 ust. 1 lit. c RODO,
e) dochodzenia ewentualnych roszczeń — podstawa: art. 6 ust. 1 lit. f RODO (nasz prawnie uzasadniony interes).


**4. KOMU PRZEKAZUJEMY TWOJE DANE?**

Twoje dane możemy przekazać:
• operatorowi płatności **Stripe Payments Europe Ltd.** (przetwarzanie płatności BLIK/karta),
• operatorowi map **Mapbox** (wyświetlanie tras),
• dostawcom hostingu i poczty elektronicznej,
• biuru rachunkowemu — w zakresie niezbędnym do prowadzenia księgowości,
• organom państwowym — gdy wymagają tego przepisy prawa.

Dane mogą być przekazywane poza Europejski Obszar Gospodarczy (np. do USA – Stripe, Mapbox). Odbywa się to w oparciu o standardowe klauzule umowne zatwierdzone przez Komisję Europejską.


**5. JAK DŁUGO PRZECHOWUJEMY TWOJE DANE?**

• Dane dotyczące rezerwacji i przewozów – przez 5 lat od końca roku, w którym zrealizowaliśmy usługę (wymóg podatkowy).
• Dane kontaktowe – do momentu cofnięcia przez Ciebie zgody lub wniesienia sprzeciwu.
• Dane płatnicze – zgodnie z polityką Stripe (zwykle 7 lat).


**6. TWOJE PRAWA**

Masz prawo do:
• dostępu do swoich danych,
• sprostowania (poprawiania) danych,
• usunięcia danych ("prawo do bycia zapomnianym"),
• ograniczenia przetwarzania,
• przenoszenia danych,
• wniesienia sprzeciwu wobec przetwarzania,
• cofnięcia zgody w dowolnym momencie (bez wpływu na zgodność z prawem przetwarzania, którego dokonano wcześniej),
• wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa).

Żeby skorzystać z tych praw, wyślij e-mail na ${COMPANY.email}.


**7. PLIKI COOKIES I DANE TECHNICZNE**

Aplikacja może wykorzystywać:
• pliki cookies/AsyncStorage – do zapamiętania Twoich preferencji,
• identyfikator powiadomień push – jeśli wyrazisz zgodę na powiadomienia,
• dane geolokalizacyjne – tylko podczas korzystania z funkcji TAXI i tylko gdy wyrazisz zgodę systemową.

Możesz w każdej chwili wyłączyć powiadomienia i geolokalizację w ustawieniach systemu operacyjnego urządzenia.


**8. BEZPIECZEŃSTWO DANYCH**

Twoje dane są przechowywane na zabezpieczonych serwerach. Komunikacja z aplikacją odbywa się przez szyfrowane połączenie HTTPS/TLS. Dane płatnicze są obsługiwane wyłącznie przez Stripe (PCI-DSS Level 1).


**9. ZMIANY POLITYKI PRYWATNOŚCI**

Zastrzegamy sobie prawo do wprowadzania zmian w niniejszej Polityce. O istotnych zmianach powiadomimy Cię przez aplikację lub e-mailem co najmniej 7 dni przed ich wprowadzeniem.


Data ostatniej aktualizacji: ${PRIVACY_POLICY_UPDATED}
`;


export const TERMS = `
**§ 1. POSTANOWIENIA OGÓLNE**

1. Niniejszy Regulamin określa zasady korzystania z aplikacji **TAXIGO** oraz świadczenia usług przewozowych i organizacji wycieczek turystycznych przez:

**${COMPANY.name}**
${COMPANY.address}
NIP: ${COMPANY.nip}
E-mail: ${COMPANY.email}
Telefon: ${COMPANY.phoneIntl}

zwany dalej "Usługodawcą".

2. Aplikacja umożliwia:
   a) zamawianie przewozu osobowego (TAXI) w Krakowie i okolicach,
   b) rezerwowanie wycieczek turystycznych jednodniowych z Krakowa.


**§ 2. DEFINICJE**

• **Klient** – pełnoletnia osoba fizyczna, osoba prawna lub jednostka organizacyjna korzystająca z aplikacji.
• **Kierowca** – Usługodawca lub osoba przez niego upoważniona, świadcząca przewóz.
• **Wycieczka** – jednodniowa usługa turystyczna obejmująca transport samochodem osobowym Toyota Prius (max 4 pasażerów) wraz z dodatkowymi świadczeniami opisanymi w karcie wycieczki.
• **Rezerwacja** – umowa pomiędzy Klientem a Usługodawcą zawierana drogą elektroniczną poprzez aplikację.


**§ 3. PRZEDMIOT UMOWY**

1. Cena przewozu TAXI: opłata startowa 5,00 zł + 3,00 zł za każdy przejechany kilometr. Cena zawiera 8% VAT (PKWiU 49.32).
2. Cena wycieczki jest podana w opisie każdej wycieczki w aplikacji i obejmuje świadczenia wymienione w sekcji "Co w cenie". Cena podana jest za osobę.
3. Cena nie obejmuje świadczeń wymienionych w sekcji "Nie zawiera" karty wycieczki (np. biletów wstępu, posiłków).


**§ 4. ZAWARCIE UMOWY (REZERWACJA WYCIECZKI)**

1. Aby zarezerwować wycieczkę, Klient:
   a) wybiera wycieczkę w aplikacji,
   b) wybiera datę z dostępnego kalendarza,
   c) podaje liczbę osób, dane kontaktowe i adres odbioru,
   d) wybiera metodę płatności,
   e) potwierdza rezerwację przyciskiem "Zarezerwuj".

2. Umowa zostaje zawarta z chwilą otrzymania przez Klienta potwierdzenia rezerwacji (numer rezerwacji w aplikacji oraz status "Oczekująca").

3. Usługodawca kontaktuje się z Klientem telefonicznie w ciągu 24 godzin w celu potwierdzenia rezerwacji. Status zmienia się wówczas na "Potwierdzona".


**§ 5. METODY PŁATNOŚCI**

Klient może wybrać jedną z następujących metod:
1. **Gotówka u kierowcy** – płatność w dniu wycieczki, w siedzibie odbioru lub po jej zakończeniu.
2. **Karta u kierowcy** – płatność terminalem mobilnym w dniu wycieczki.
3. **BLIK online** – płatność przez aplikację bankową Klienta przed wycieczką. Obsługiwana przez Stripe.
4. **Negocjacja ceny** – Klient proponuje własną cenę. Po akceptacji przez Usługodawcę umowa zostaje zawarta według proponowanych warunków.


**§ 6. PRAWO ODSTĄPIENIA OD UMOWY**

1. Zgodnie z art. 38 pkt 12 ustawy o prawach konsumenta, prawo odstąpienia od umowy zawartej na odległość **nie przysługuje** Klientowi w odniesieniu do umów o świadczenie usług w zakresie przewozu osób oraz usług turystycznych jeżeli w umowie oznaczono dzień lub okres świadczenia usługi.

2. Klient może bezpłatnie anulować rezerwację wycieczki nie później niż **48 godzin** przed planowaną datą wycieczki – wówczas Usługodawca zwraca pełną kwotę w terminie 14 dni.

3. Anulowanie później niż 48 godzin przed wycieczką: zwrot 50% kwoty.

4. Anulowanie w dniu wycieczki lub niestawienie się: brak zwrotu.

5. W razie odwołania wycieczki przez Usługodawcę (np. zła pogoda, choroba kierowcy) – Klient otrzymuje **pełny zwrot** lub propozycję innego terminu.


**§ 7. REALIZACJA USŁUGI**

1. Kierowca odbiera Klienta z podanego adresu o ustalonej godzinie. Klient zobowiązany jest być gotowy do wyjazdu maksymalnie 10 minut po ustalonej godzinie.

2. Klient zobowiązany jest do przestrzegania zasad bezpieczeństwa, w tym zapinania pasów i stosowania się do poleceń kierowcy.

3. Kierowca ma prawo odmówić przewozu osobom będącym pod wpływem alkoholu lub innych środków odurzających.

4. Klient odpowiada za szkody wyrządzone w pojeździe.


**§ 8. REKLAMACJE**

1. Reklamacje należy zgłaszać:
   • e-mailem na ${COMPANY.email}, lub
   • telefonicznie na ${COMPANY.phoneIntl}.

2. Reklamacja powinna zawierać: numer rezerwacji, datę usługi, opis zastrzeżeń, dane kontaktowe.

3. Usługodawca rozpatruje reklamację w terminie do 14 dni od otrzymania.


**§ 9. ODPOWIEDZIALNOŚĆ**

1. Usługodawca odpowiada za szkody wyrządzone z winy umyślnej lub rażącego niedbalstwa.

2. Usługodawca nie odpowiada za:
   • opóźnienia wynikające z siły wyższej (korki, blokady drogowe, warunki pogodowe),
   • zamknięcie atrakcji turystycznych przez ich administratorów,
   • działania osób trzecich,
   • rzeczy zostawione przez Klienta w pojeździe.


**§ 10. OCHRONA DANYCH OSOBOWYCH**

Zasady przetwarzania danych osobowych określa **Polityka prywatności** dostępna w aplikacji.


**§ 11. POSTANOWIENIA KOŃCOWE**

1. W sprawach nieuregulowanych Regulaminem stosuje się przepisy prawa polskiego, w szczególności Kodeksu cywilnego oraz ustawy o prawach konsumenta.

2. Sądem właściwym do rozstrzygania sporów jest sąd właściwy dla miejsca zamieszkania Klienta (jeśli jest konsumentem) lub sąd właściwy dla siedziby Usługodawcy.

3. Konsument może skorzystać z platformy ODR Komisji Europejskiej: https://ec.europa.eu/consumers/odr.

4. Usługodawca zastrzega sobie prawo do zmiany Regulaminu z 7-dniowym wyprzedzeniem. Nowy Regulamin nie dotyczy rezerwacji złożonych przed jego wprowadzeniem.

5. Regulamin wchodzi w życie z dniem ${TERMS_UPDATED}.


Data ostatniej aktualizacji: ${TERMS_UPDATED}
`;
