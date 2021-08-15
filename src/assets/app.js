const $fileUpload = document.getElementById("file_upload");
const $trButton = document.getElementById("tr_button");
const $dnButton = document.getElementById("dn_button");

const $textUpload = document.getElementById("text_upload");
const $txButton = document.getElementById("tx_button");
const $fileLabel = document.getElementById("file_label")

const $apiInput = document.getElementById("api_input")

const $bottomAlert = document.getElementById("bottom_alert")

const api = "TA3mQy2sqaAzqSj3AfEiTAQDscdAB%2FLb9O3rCOjjnDsMx3AAiCs5O8D6hR0VnLZBarvFxstIuz%2FE9SB52sgaVA%3D%3D"

let isEnableDownload = false;
let loadNumber = []
let loadId = []
let resultArr = []

$fileUpload.addEventListener("change", (e) => {
  let input = e.target
  let reader = new FileReader();

  $fileLabel.innerText = "업로드 중..."

  reader.onload = () => {
    let data = reader.result;

    let workBook = XLSX.read(data, { type: "binary" });

    workBook.SheetNames.forEach((sheetName) => {
      // console.log("SheetName: ", sheetName);
      let rows = XLSX.utils.sheet_to_json(workBook.Sheets[sheetName]);
      dataIn(rows);
    });
  };
  if (input.files.length !== 0) {
    reader.readAsBinaryString(input.files[0]);
    $fileLabel.innerText = input.value
  } else {
    $fileLabel.innerText = "파일 업로드"
  }
  
});

function dataIn(rows) {
  // 전체 엑셀 수
  let excelCount = 0;
  // 전체엑셀 수 / 10, 1번 API호출 = 10개의 배열만이 가능하기 때문에
  let count10;

  // 전체 데이터
  console.log(rows);

  // 전체 데이터 갯수 / 10 만큼 2차원 배열 할당
  loadNumber = Array(Math.ceil(rows.length / 10))
    .fill(null)
    .map(() => Array());
  loadId = Array(Math.ceil(rows.length / 10))
    .fill(null)
    .map(() => Array());

  // console.log(loadNumber.length,loadId.length);
  rows.map((R) => {
    count10 = parseInt(excelCount++ / 10);
    if (R.가맹점관리번호 && R.사업자등록번호) {
      loadNumber[count10].push(R.사업자등록번호);
      loadId[count10].push(R.가맹점관리번호);
    }
  });
}

$trButton.addEventListener("click", async () => {
  if (!$fileUpload.value) return alert("파일을 업로드해주세요.");
  // 엑셀 변환해서 Export

  for (let i = 0; i < loadId.length; i++) {
    let res = await apiReq(loadNumber[i]);
    if(!res.result || !res.status) return alert("API 오류 발생")

    for (let j = 0; j < res.result.length; j++) {
      res.result[j].가맹점관리번호 = loadId[i][j];
    }
    resultArr[i] = res.result;
  }

  // console.log(resultArr.flat())
  isEnableDownload = true;
  alert("변환 완료!");
});

$dnButton.addEventListener("click", () => {
  if (!$fileUpload.value) return alert("파일을 업로드해주세요.");
  if(!isEnableDownload) return alert("변환이 완료된 후 다운로드할 수 있습니다.")

  const myHeader = ["가맹점관리번호", "사업자등록번호"];

  resultArr = resultArr.flat()
  resultArr.forEach(arr => reNameKey(arr, "b_no","사업자등록번호"))
  const workSheetData = resultArr


  const workSheet = XLSX.utils.json_to_sheet(workSheetData, {
    header: myHeader,
  });

  const workBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workBook, workSheet, "사업자등록번호 변환");
  XLSX.writeFile(workBook, "엑셀_파일_명.xlsx");
});

// b_no => 사업자등록번호, key 이름 변경
function reNameKey(obj, oldKey, newKey) {
  obj[newKey] = obj[oldKey]
  delete obj[oldKey]
}

// 단건 처리
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
  if(!$apiInput.value) return alert("API KEY를 입력해주세요.")
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
    `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${$apiInput.value}`,
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
      _returnValue.status = undefined
      _returnValue.result = undefined
    });

  return _returnValue;
};