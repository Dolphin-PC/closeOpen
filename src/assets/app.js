const $fileUpload = document.getElementById("file_upload");
const $trButton = document.getElementById("tr_button");
const $dnButton = document.getElementById("dn_button");

const $textUpload = document.getElementById("text_upload");
const $txButton = document.getElementById("tx_button");
const $fileLabel = document.getElementById("file_label");

const $apiInput = document.getElementById("api_input");

const $bottomAlert = document.getElementById("bottom_alert");

const $singleSearch = document.getElementById("singleSearch");

// const $copyApiText = document.getElementById('copy_api')

let api;

let isEnableDownload = false;
let loadNumber = [];
let loadId = [];
let resultArr = [];

$fileUpload.addEventListener("change", (e) => {
  let input = e.target;
  let reader = new FileReader();

  $fileLabel.innerText = "업로드 중...";

  reader.onload = () => {
    let data = reader.result;

    let workBook = XLSX.read(data, {
      type: "binary"
    });

    workBook.SheetNames.forEach((sheetName) => {
      // console.log("SheetName: ", sheetName);
      let rows = XLSX.utils.sheet_to_json(workBook.Sheets[sheetName]);
      dataIn(rows);
    });
  };
  if (input.files.length !== 0) {
    reader.readAsBinaryString(input.files[0]);
    $fileLabel.innerText = input.value;
  } else {
    $fileLabel.innerText = "파일 업로드";
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
      count10 = parseInt(excelCount++/ 10);
        if (R.가맹점관리번호 && R.사업자등록번호) {
          loadNumber[count10].push(R.사업자등록번호 + "");
          loadId[count10].push(R.가맹점관리번호);
        }
      });
  }

  $trButton.addEventListener("click", async () => {
    if (!$apiInput.value) return alert("API KEY를 입력해주세요.");
    if (!$fileUpload.value) return alert("파일을 업로드해주세요.");

    for (let i = 0; i < loadId.length; i++) {
      let res = await apiReq(loadNumber[i]);
      if (!res.result || !res.status) return alert("API 오류 발생");

      for (let j = 0; j < res.result.length; j++) {
        res.result[j].가맹점관리번호 = loadId[i][j];
      }
      $fileLabel.innerText = `변환 중입니다... ${i}/${loadId.length}`;
      console.log("변환 중입니다..", i, loadId.length);
      resultArr[i] = res.result;
    }

    // console.log(resultArr.flat())
    isEnableDownload = true;
    $fileLabel.innerText =
      "변환 완료! (다음 변환을 하시려면 새로고침 후 사용해주세요.)";
    $apiInput.setAttribute = "disable";
    alert("변환 완료!");
  });

  $dnButton.addEventListener("click", () => {
    if (!$fileUpload.value) return alert("파일을 업로드해주세요.");
    if (!isEnableDownload)
      return alert("변환이 완료된 후 다운로드할 수 있습니다.");

    const myHeader = ["가맹점관리번호", "사업자등록번호"];

    resultArr = resultArr.flat();
    resultArr.forEach((arr) => {
      reNameKey(arr, "b_no", "사업자등록번호");
      reNameKey(arr, "b_stt", "납세자상태(명칭)");
      reNameKey(arr, "b_stt_cd", "납세자상태(코드)");
      reNameKey(arr, "tax_type", "과세유형메세지(명칭)");
      reNameKey(arr, "tax_type_cd", "과세유형메세지(코드)");
      reNameKey(arr, "end_dt", "폐업일 (YYYYMMDD 포맷)");
      reNameKey(arr, "utcc_yn", "단위과세전환폐업여부(Y,N)");
      reNameKey(
        arr,
        "tax_type_change_dt",
        "최근과세유형전환일자 (YYYYMMDD 포맷)"
      );
      reNameKey(arr, "invoice_apply_dt", "세금계산서적용일자 (YYYYMMDD 포맷)");
    });
    const workSheetData = resultArr;

    const workSheet = XLSX.utils.json_to_sheet(workSheetData, {
      header: myHeader,
    });

    const workBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workBook, workSheet, "사업자등록번호 변환");
    XLSX.writeFile(workBook, `휴폐업_조회결과.xlsx`);
  });

  // b_no => 사업자등록번호, key 이름 변경
  function reNameKey(obj, oldKey, newKey) {
    obj[newKey] = obj[oldKey];
    delete obj[oldKey];
  }

  // 단건 처리
  $txButton.addEventListener("click", async () => {
    let text = $textUpload.value;

    if (text.length !== 10)
      return alert("사업자등록번호 10자리를 입력해주세요.")

    console.log(text);

    try {
      let arr = [text];

      // API 호출
      const data = await apiReq(arr);

      console.log(data);
      $singleSearch.innerText = `조회한 사업자번호 : ${data.result[0].b_no} / 조회결과 : ${data.result[0].tax_type}`;
      alert(
        `조회한 사업자번호 : ${data.result[0].b_no} / 조회결과 : ${data.result[0].tax_type}`
      );

    } catch (err) {
      console.error(err)
      alert("API 오류 발생!(API KEY를 다시 한번 확인해주세요)")
    }
  });

  const apiReq = async (dataArr = []) => {
    if (!$apiInput.value) return alert("API KEY를 입력해주세요.");
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
        _returnValue.status = undefined;
        _returnValue.result = undefined;
      });

    return _returnValue;
  };