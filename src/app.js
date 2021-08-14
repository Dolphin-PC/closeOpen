const $fileUpload = document.getElementById("file_upload");
const $trButton = document.getElementById("tr_button");
const $dnButton = document.getElementById("dn_button");

const $textUpload = document.getElementById("text_upload");
const $txButton = document.getElementById("tx_button");

let isEnable = false;
let loadFile = [];

$fileUpload.addEventListener("change", (e) => {
  let input = e.target;
  let reader = new FileReader();

  reader.onload = () => {
    let data = reader.result;

    let workBook = XLSX.read(data, { type: "binary" });

    workBook.SheetNames.forEach((sheetName) => {
      // console.log("SheetName: ", sheetName);
      let rows = XLSX.utils.sheet_to_json(workBook.Sheets[sheetName]);
      console.log(rows);
      loadFile = rows.map(rowChange);
    });
  };

  reader.readAsBinaryString(input.files[0]);
});

const rowChange = (R) => {
  if (!R.가맹점관리번호) return console.error("가맹점 관리번호 없음");
  if (!R.사업자등록번호) return console.error("사업자등록번호 없음");

  return {
    가맹점관리번호: R.가맹점관리번호,
    사업자등록번호: R.사업자등록번호,
  };
};

$trButton.addEventListener("click", () => {
  console.log(loadFile);
});

// sample test
$txButton.addEventListener("click", async () => {
  let text = $textUpload.value;

  if (text.length !== 10)
    return console.error("사업자등록번호 10자리를 입력해주세요.");
  console.log(text);

  let arr = [text];

  // API 호출
  const data = await apiReq(arr);

  console.log(data);
});

const apiReq = async (dataArr = []) => {
  let _returnValue = {
    result: [],
    status: "",
  };

  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  var raw = JSON.stringify({
    b_no: dataArr,
  });

  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  await fetch(
    "https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=TA3mQy2sqaAzqSj3AfEiTAQDscdAB%2FLb9O3rCOjjnDsMx3AAiCs5O8D6hR0VnLZBarvFxstIuz%2FE9SB52sgaVA%3D%3D",
    requestOptions
  )
    .then((response) => response.json())
    .then((result) => {
      // console.log(result);
      _returnValue.status = result.status_code;
      _returnValue.result = result.data;
    })
    .catch((error) => {
      // console.log("error", error);
      _returnValue.status = "ERROR";
      _returnValue.result = [];
    });

  return _returnValue;
};
