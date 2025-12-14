document.addEventListener("DOMContentLoaded", () => {
// задача 1
//    const a = 12;
//    const b = 2;
//    let c = a % b;
//    console.log(c);

// задача 2
//  let arr = ['2','-3','4','-9','-8'];
//  console.log("['2','-3','4','-8']");

// задача 3
//  function fibonacci(a) {
//      if (a < 2) {
//          return a;
//      }
//      else {
//          return fibonacci(a - 1) + fibonacci(a - 2);
//      }
//  }
//  alert(fibonacci(12));

// задача 4
//  let a = 34;
//  let b = a % 100;
//  console.log((b));

// задачм 5
//  let a = 1357;
//  let count = 0;
//  for (let i = 1; i < a; i++) {
//      if (a % 2 == 0) {
//          count = count + 1;
//      }
//  }
//  console.log(count);

// задача 6
//    function FullArray() {
//        const arr = ['яблоко', 'груша', 'банан', 'киви'];
//        const x = Math.floor(Math.random() * arr.length);
//        const t = arr[x];
//
//        console.log(t);
//    }
//    FullArray()

// задача 7
//    function color() {
//        const arr = ['красный','синий','зелёный','жёлтый','фиолетовый','чёрный','белый','голубой','оранжевый','розовый'];
//        const x1 = Math.floor(Math.random() * arr.length);
//        const t1 = arr[x1];
//        const x2 = Math.floor(Math.random() * arr.length);
//        const t2 = arr[x2];
//
//        console.log(t1, "и", t2);
//    }
//    color();

// задача 8
//    function symbol() {
//        const a = '*';
//        const engl = "q w e r t y u i o p a s d f g h j k l z x c v b n m";
//        const rus = "й ц у к е н г ш щ з х ъ ф ы в а п р о л д ж э я ч с м и т ь б ю";
//        if (rus.toLowerCase().indexOf(a.toLowerCase()) !== -1) {
//            console.log("Russian Alphabet");
//        }
//        else {
//            console.log("England Alphabet");
//        }
//    }
//    symbol();

// задача 9
//    function arrmima() {
//        const num = [10, 5, 20, 8, 15];
//        const m = Math.max(...num);
//        console.log("Максимальный элемент:", m);
//
//        const mi = Math.min(...num);
//        console.log("Минимальный элемент:", mi);
//    }
//    arrmima();

// задача 10
//    function light() {
//        k = 11;
//        if ((k % 2 == 0 || k % 3 == 0 || k % 4 == 0 || k % 5 == 0 || k % 6 == 0 || k % 7 == 0 || k % 8 == 0 || k % 9 == 0) && (k != 2 || k != 3 || k != 5 || k != 7))
//            console.log("Число не простое");
//        else
//            console.log("Число простое");
//    }
//    light();

// задача 11
//    const a = "27/17";
//    const ans = a.includes("/");
//    if (ans)
//        console.log("Дробное число");
//    else
//        console.log("Число не является дробью");

// задача 12
//    function comp() {
//        const a = 16;
//        const b = 14;
//        let arr = [];
//        if (a > b) {
//            arr = [b, a];
//            console.log(arr);
//        }
//        else {
//            arr = [a, b];
//            console.log(arr);
//        }
//    }
//    comp();

// задача 13
//    function slog() {
//        const text = "moloko bilo ochen vkusnoe";
//        const w = text.split(" ");
//        const letter = {};
//
//        for (const word of w) {
//          const first = word[0].toLowerCase();
//
//          if (!letter[first]) {
//            letter[first] = [];
//          }
//
//          letter[first].push(word);
//        }
//
//        console.log(letter);
//    }
//    slog();

// задача 14
//    const sumButton = document.getElementById('sumButton');
//    const result = document.getElementById('result');
//
//    sumButton.addEventListener('click', function() {
//        const a = 15;
//        const b = 4;
//        const sum = a + b;
//        result.textContent = 'Сумма: ' + sum;
//    });

// задача 15
//    const textButton = document.getElementById('textButton');
//    const result2 = document.getElementById('result2');
//
//    textButton.addEventListener('click', function() {
//        const texting = "Привет меня зовут Леонид мне 14 лет. Я люблю программировать на JavaScript!";
//        const kvadrat = texting + " " + texting;
//        result2.textContent = "Квадрат текста: " + kvadrat;
//    });

// задача 16
//    const firstB = document.getElementById('firstButton');
//    const secondB = document.getElementById('secondButton');
//    const result12 = document.getElementById('result12');
//    const result13 = document.getElementById('result13');
//
//    firstB.addEventListener('click', function() {
//        const a = 2;
//        const kvadratA = a * a;
//        result12.textContent = "Квадрат первого числа: " + kvadratA;
//    });
//    secondB.addEventListener('click', function() {
//        const b = 3;
//        const kvadratB = b * b;
//        result13.textContent = "Квадрат второго числа: " + kvadratB;
//    });

// задача 17
//    const sumB = document.getElementById('sum100Button');
//    const result52 = document.getElementById('result52');
//
//    sumB.addEventListener('click', function() {
//        const sum = 49 * 100 + 100 + 50;
//        result52.textContent = "Сумма чисел от 1 до 100: " + sum;
//    });

// задача 18
//    const sumB = document.getElementById('s8Button');
//    const result782 = document.getElementById('result782');
//
//    sumB.addEventListener('click', function() {
//        let a = "[1, 2, 3, 4]";
//        let bbb1 = a;
//        result782.textContent = "Массив в списке: ", bbb1;
//    });

// задача 19
    const sumB = document.getElementById('s8Button');
    const result782 = document.getElementById('result782');

    sumB.addEventListener('click', function() {
        let a = 6;
        let cnt = 1;
        for (int i = 1; i <= a; i++) {
            i *= cnt;
        }
        result782.textContent = "Факториал числа: ", cnt;
    });
});
