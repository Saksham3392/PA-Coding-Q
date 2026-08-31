/**
 * Java Practice Lab - Curriculum & Questions Bank
 * Categorized by Topics
 */

window.PROBLEMS = {
  q01_sum_of_all_the_elements_of_an_array: {
    id: "q01_sum_of_all_the_elements_of_an_array",
    num: "01",
    title: "Sum of all the elements of an Array",
    tag: "1D Arrays",
    category: "Arrays in Java",
    subtitle: "Summation & Array Traversal",
    brief: `Write a program to find the sum of all the elements of an array.

Input
Assume the size of array as 10.
Each test case will have 10 elements in ten different lines.

Output
For each test case, print the sum of all the elements of the array.`,
    inputFormat: "Assume the size of array as 10. Each test case will have 10 elements in ten different lines.",
    outputFormat: "For each test case, print the sum of all the elements of the array.",
    starterCode: `import java.util.*;
class Main
{
  public static void main(String[] args)
  {
    // Write your code here





  }
}`,
    solutionCode: `import java.util.Scanner;
class Main
{
    public static void main(String[] args){
    Scanner sc = new Scanner(System.in);
    //create array 
    int[] arr = new int[10];
    int sum=0;
    //read 10 elements and sum of all elements
    for(int i=0; i<arr.length; i++){
        arr[i] = sc.nextInt();
        sum += arr[i];
    }
    System.out.println(sum);
  }
}`,
    hints: [
      {
        title: "Scanner & Array",
        text: "Create an array of size 10: <code>int[] arr = new int[10];</code> and initialize <code>int sum = 0;</code>"
      },
      {
        title: "Loop & Accumulation",
        text: "Read elements using a loop: <code>for(int i=0; i<arr.length; i++) { arr[i] = sc.nextInt(); sum += arr[i]; }</code>"
      },
      {
        title: "Print Result",
        text: "After reading all 10 integers, print the sum: <code>System.out.println(sum);</code>"
      }
    ],
    sampleCases: [
      {
        id: 1,
        input: "3\n10\n20\n4\n7\n1\n2\n3\n4\n5",
        expected: "59",
        explanation: "Sum of 3 + 10 + 20 + 4 + 7 + 1 + 2 + 3 + 4 + 5 = 59."
      },
      {
        id: 2,
        input: "1\n2\n3\n4\n5\n6\n7\n8\n9\n10",
        expected: "55",
        explanation: "Sum of first 10 natural numbers = 55."
      },
      {
        id: 3,
        input: "0\n0\n0\n0\n0\n0\n0\n0\n0\n0",
        expected: "0",
        explanation: "Sum of 10 zeros is 0."
      }
    ],
    edgeCases: [
      {
        id: 4,
        input: "-5\n10\n-3\n8\n-2\n4\n-1\n5\n0\n-6",
        expected: "10",
        explanation: "Sum of negative and positive integers: (-5)+10+(-3)+8+(-2)+4+(-1)+5+0+(-6) = 10."
      },
      {
        id: 5,
        input: "100\n200\n300\n400\n500\n600\n700\n800\n900\n1000",
        expected: "5500",
        explanation: "Sum of multiples of 100 up to 1000 = 5500."
      }
    ]
  },

  q02_maximum_element_in_an_array: {
    id: "q02_maximum_element_in_an_array",
    num: "02",
    title: "Maximum element in an Array",
    tag: "Array Search",
    category: "Arrays in Java",
    subtitle: "Finding Maximum Value in 1D Array",
    brief: `Write a program to find the maximum element in an array.

Input Format:
The first line of input contains an integer N, denoting the size of array.
The second line contains N space separated integers, denoting the array elements.

Output Format:
For each test case, print the maximum element in the array.

Constraints:
1 <= N <= 10^5
-1000 <= arr[i] <= 1000`,
    inputFormat: "First line contains integer N (array size). Second line contains N space-separated integers.",
    outputFormat: "Print the maximum element in the array.",
    starterCode: `class Result {
  static int maxElement(int[] arr, int N) {
    // Write Your Code here
    



  }
}`,
    solutionCode: `class Result {
    static int maxElement(int[] arr, int N) {
        int max = arr[0];
        for (int i = 1; i < N; i++) {
            if (arr[i] > max) {
                max = arr[i];
            }
        }
        return max;
    }
}`,
    hints: [
      {
        title: "Initialize Maximum",
        text: "Start with <code>int max = arr[0];</code> to track the largest element found so far."
      },
      {
        title: "Linear Scan",
        text: "Loop from index 1 to N-1: <code>for(int i = 1; i < N; i++)</code>. If <code>arr[i] > max</code>, update <code>max = arr[i];</code>"
      },
      {
        title: "Return Value",
        text: "Return the accumulated maximum value: <code>return max;</code>"
      }
    ],
    sampleCases: [
      {
        id: 1,
        input: "7\n20 30 93 71 18 82 66",
        expected: "93",
        explanation: "Among [20, 30, 93, 71, 18, 82, 66], 93 is the maximum element."
      },
      {
        id: 2,
        input: "5\n33 45 67 33 67",
        expected: "67",
        explanation: "Among [33, 45, 67, 33, 67], 67 is the maximum element."
      }
    ],
    edgeCases: [
      {
        id: 3,
        input: "1\n42",
        expected: "42",
        explanation: "Single element array."
      },
      {
        id: 4,
        input: "6\n-100 -50 -20 -300 -10 -500",
        expected: "-10",
        explanation: "All negative numbers; -10 is the maximum."
      },
      {
        id: 5,
        input: "4\n0 0 0 0",
        expected: "0",
        explanation: "All elements equal."
      }
    ]
  },

  q03_copy_elements_of_an_array: {
    id: "q03_copy_elements_of_an_array",
    num: "03",
    title: "Copy elements of an Array",
    tag: "Array Manipulation",
    category: "Arrays in Java",
    subtitle: "Reverse Copying & Element Traversal",
    brief: `Write a program to copy the elements of an array a to the another array b in reverse order.

Input
Assume the size of array as 10. Each test case will have 10 elements in ten different lines.

Output
For each test case print the elements of the new array.`,
    inputFormat: "Assume the size of array as 10. Each test case will have 10 elements in ten different lines.",
    outputFormat: "For each test case print the elements of the new array.",
    starterCode: `import java.util.*;
class Main
{
  public static void main(String[] args)
  {
    // Write your code here
      
      
      
      
  }
}`,
    solutionCode: `import java.util.*;
class Main
{
  public static void main(String[] args)
  {
    Scanner sc = new Scanner(System.in);
    int[] a = new int[10];
    for (int i = 0; i < a.length; i++)
            a[i] = sc.nextInt();  
    for (int i=9; i>=0; i--)
        System.out.println(a[i]);
  }
}`,
    hints: [
      {
        title: "Reading Array",
        text: "Create array <code>int[] a = new int[10];</code> and read 10 values using <code>for(int i=0; i<a.length; i++) a[i] = sc.nextInt();</code>"
      },
      {
        title: "Reverse Printing",
        text: "Iterate from index 9 down to 0: <code>for(int i = 9; i >= 0; i--) System.out.println(a[i]);</code>"
      }
    ],
    sampleCases: [
      {
        id: 1,
        input: "3\n10\n20\n4\n7\n1\n2\n3\n4\n5",
        expected: "5\n4\n3\n2\n1\n7\n4\n20\n10\n3",
        explanation: "The elements copied and printed in reverse order."
      },
      {
        id: 2,
        input: "1\n2\n3\n4\n5\n6\n7\n8\n9\n10",
        expected: "10\n9\n8\n7\n6\n5\n4\n3\n2\n1",
        explanation: "Numbers 1 to 10 printed in reverse."
      }
    ],
    edgeCases: [
      {
        id: 3,
        input: "0\n0\n0\n0\n0\n0\n0\n0\n0\n0",
        expected: "0\n0\n0\n0\n0\n0\n0\n0\n0\n0",
        explanation: "All zeros reversed."
      },
      {
        id: 4,
        input: "-1\n-2\n-3\n-4\n-5\n-6\n-7\n-8\n-9\n-10",
        expected: "-10\n-9\n-8\n-7\n-6\n-5\n-4\n-3\n-2\n-1",
        explanation: "Negative values reversed."
      }
    ]
  },

  q04_matrix_multiplication: {
    id: "q04_matrix_multiplication",
    num: "04",
    title: "Matrix Multiplication",
    tag: "2D Arrays",
    category: "Arrays in Java",
    subtitle: "Matrix Dot Product & 2D Array Traversal",
    image: "matrix_multiplication.png",
    brief: `Given two matrices A and B in the form of two dimensional arrays, find the dot product of these two matrices.

Input Format:
First line of input will contain an integer T = no. of test cases.
Each test case will follow in multiple lines. First line of each test case will contain two integers R1 = no. of rows in matrix A and C1 = no. of columns in matrix A. Next R1 lines will each contain C1 space separated integers. Next line again contain two integers R2 = no. of rows in B and C2 = no. columns in B. C1 will be equal to R2.

Output Format:
For each test case print matrix of size R1*C2 in R1 lines with each line containing C2 space separated integers of corresponding row.

Constraints:
1 <= T <= 1000
1 <= R1, C1, R2, C2 <= 50
C1 will be equals to R2`,
    inputFormat: "First line: T (test cases). For each test case: R1 C1, matrix A rows, R2 C2, matrix B rows.",
    outputFormat: "Print matrix of size R1*C2 with space-separated integers for each row.",
    starterCode: `class Result {
  // Print the resultant matrix after (A * B)
  static void multiplyMatrix(int A[][],int B[][], int R1, int C1, int R2, int C2) {
    // Write your code here
    
      
      
      
      
  }
}`,
    solutionCode: `class Result {
  // Print the resultant matrix after (A * B)
  static void multiplyMatrix(int A[][],int B[][], int R1, int C1, int R2, int C2) {
    // Write your code here
    for(int i=0;i<R1;i++){
        for(int j=0; j<C2;j++){
            int sum=0;
            for(int k=0;k<C1;k++){
                sum+=A[i][k]*B[k][j];
            }
            System.out.print(sum+" ");
        }
        System.out.println();
    }
  }
}`,
    hints: [
      {
        title: "Dimensions of Result",
        text: "The product of matrix A (size R1 × C1) and matrix B (size R2 × C2, where C1 = R2) has dimensions <code>R1 × C2</code>."
      },
      {
        title: "Three Nested Loops",
        text: "Use loop <code>i</code> from 0 to R1-1 (rows of A), loop <code>j</code> from 0 to C2-1 (columns of B), and innermost loop <code>k</code> from 0 to C1-1 to compute <code>sum += A[i][k] * B[k][j];</code>"
      },
      {
        title: "Print Row Elements",
        text: 'Print each row\'s computed sums separated by spaces using <code>System.out.print(sum + " ");</code>, followed by <code>System.out.println();</code> after each row.'
      }
    ],
    sampleCases: [
      {
        id: 1,
        input: "2\n2 3\n1 2 3\n4 5 6\n3 2\n2 3\n1 2\n2 1\n2 2\n12 4\n7 6\n2 3\n2 4 6\n3 5 7",
        expected: "10 10\n25 28\n36 68 100\n32 58 84",
        explanation: "Product of matrices for the two test cases."
      },
      {
        id: 2,
        input: "1\n1 1\n5\n1 1\n6",
        expected: "30",
        explanation: "1x1 matrix multiplication: 5 * 6 = 30."
      }
    ],
    edgeCases: [
      {
        id: 3,
        input: "1\n2 2\n3 7\n2 4\n2 2\n1 0\n0 1",
        expected: "3 7\n2 4",
        explanation: "Multiplication with 2x2 identity matrix."
      },
      {
        id: 4,
        input: "1\n2 2\n0 0\n0 0\n2 2\n5 9\n4 2",
        expected: "0 0\n0 0",
        explanation: "Zero matrix multiplication."
      }
    ]
  },

  q05_spirally_traversing_a_matrix: {
    id: "q05_spirally_traversing_a_matrix",
    num: "05",
    title: "Spirally traversing a matrix",
    tag: "2D Arrays",
    category: "Arrays in Java",
    subtitle: "Clockwise Matrix Spiral Traversal",
    brief: `Traversing an array is an elementary operation on an array, in which each element will be processed for some operation. Printing elements is one example operation.

Complete the function printSpiral() given in the editor, which accepts a two dimensional array and prints the array in spiral form rotating clockwise.

Input Format:
Each test-case will begin with two numbers m and n where m = no. of rows and n = no. of columns.
m rows will follow with n integers in each row separated by a space.

Output Format:
For each test case, print the elements of 2-d array in spiral form starting from index (0,0) or upper-left corner in clockwise direction.

Constraints:
1 <= m <= 50 and 1 <= n <= 50.`,
    inputFormat: "First line contains m (rows) and n (columns). Following m lines each contain n space-separated integers.",
    outputFormat: "Print the elements of the 2D array in clockwise spiral order, each on a new line.",
    starterCode: `class Result {
  static void printSpiral(int a[][], int r, int c) {
    // Write your code here
    
      
      
      
  }
}`,
    solutionCode: `class Result {
    static void printSpiral(int a[][], int r, int c) {
        // Write your code here
        int top = 0;
        int bottom = r - 1;
        int left = 0;
        int right = c - 1;
        while (top <= bottom && left <= right) {
            // Left to Right
            for (int j = left; j <= right; j++) {
                System.out.println(a[top][j]);
            }
            top++;
            // Top to Bottom
            for (int i = top; i <= bottom; i++) {
                System.out.println(a[i][right]);
            }
            right--;
            // Right to Left
            if (top <= bottom) {
                for (int j = right; j >= left; j--) {
                    System.out.println(a[bottom][j]);
                }
                bottom--;
            }
            // Bottom to Top
            if (left <= right) {
                for (int i = bottom; i >= top; i--) {
                    System.out.println(a[i][left]);
                }
                left++;
            }
        }
    }
}`,
    hints: [
      {
        title: "Four Boundaries",
        text: "Maintain four pointers: <code>top = 0</code>, <code>bottom = r - 1</code>, <code>left = 0</code>, and <code>right = c - 1</code>."
      },
      {
        title: "Clockwise Traversal Steps",
        text: "1) Traverse from <code>left</code> to <code>right</code> on row <code>top</code>, then <code>top++</code>.<br/>2) Traverse from <code>top</code> to <code>bottom</code> on column <code>right</code>, then <code>right--</code>.<br/>3) If <code>top <= bottom</code>, traverse from <code>right</code> to <code>left</code> on row <code>bottom</code>, then <code>bottom--</code>.<br/>4) If <code>left <= right</code>, traverse from <code>bottom</code> to <code>top</code> on column <code>left</code>, then <code>left++</code>."
      }
    ],
    sampleCases: [
      {
        id: 1,
        input: "3 3\n4 5 6\n7 8 9\n10 11 12",
        expected: "4\n5\n6\n9\n12\n11\n10\n7\n8",
        explanation: "Clockwise spiral traversal of 3x3 matrix starting at (0,0)."
      },
      {
        id: 2,
        input: "3 4\n4 3 2 1\n5 7 8 11\n2 4 6 8",
        expected: "4\n3\n2\n1\n11\n8\n6\n4\n2\n5\n7\n8",
        explanation: "Spiral traversal of 3x4 rectangular matrix."
      }
    ],
    edgeCases: [
      {
        id: 3,
        input: "1 4\n10 20 30 40",
        expected: "10\n20\n30\n40",
        explanation: "Single row matrix."
      },
      {
        id: 4,
        input: "4 1\n5\n10\n15\n20",
        expected: "5\n10\n15\n20",
        explanation: "Single column matrix."
      },
      {
        id: 5,
        input: "1 1\n99",
        expected: "99",
        explanation: "1x1 single element matrix."
      }
    ]
  },

  q06_rotate_a_2d_array_by_90_degrees: {
    id: "q06_rotate_a_2d_array_by_90_degrees",
    num: "06",
    title: "Rotate a 2-D array by 90 degrees",
    tag: "2D Arrays",
    category: "Arrays in Java",
    subtitle: "In-Place Matrix Rotation & Transposition",
    brief: `Given a two dimensional N*N array, print the output if the array is rotated by 90 degrees in clockwise direction.

Input Format:
First line of input will contain a number T = no. of test cases. 
Each test case will contain one line with number N (N*N is the size of the array). Next N lines will each contain N integers separated by space.

Output Format:
For each test-case, print the array rotated clockwise by 90 degrees. Each row of an array should be printed as N elements separated by exactly one space. 
There should be no space after last element in each row. Print an extra line after output for each test case.

Constraints:
1 <= T <= 10
1 <= N <= 50
0 <= arr[i][j] <= 100`,
    inputFormat: "First line contains T. For each test case: integer N, followed by N lines of N space-separated integers.",
    outputFormat: "Print each rotated row with space-separated values (no trailing space), and a blank line after each test case.",
    starterCode: `import java.util.*;
class Main
{
  public static void main(String[] args)
  {
    // Write your code here
      
      
     
      
  }
}`,
    solutionCode: `import java.util.*;
class Main
{
  public static void main(String[] args)
  {
      Scanner sc = new Scanner(System.in);
      int T = sc.nextInt();  //testcases
      //To run no. of testcases
      while(T-->0){
          int N = sc.nextInt(); //size
          int[][] matrix = new int[N][N];
      // Input
        for (int i = 0; i < N; i++) {
            for (int j = 0; j < N; j++) {
                matrix[i][j] = sc.nextInt();
            }
        }
       // Transpose
       for (int i = 0; i < N; i++) {
                for (int j = i; j < N; j++) {
                    int temp = matrix[i][j];
                    matrix[i][j] = matrix[j][i];
                    matrix[j][i] = temp;
                }
            }
        //Reverse each row
        for (int i = 0; i < N; i++) {
        for (int j = 0; j < N/2; j++) {
                int temp = matrix[i][j];
                matrix[i][j] = matrix[i][N - 1 - j];
                matrix[i][N - 1 - j] = temp;
            }
        }
        //Print
        for (int i = 0; i < N; i++) {
    for (int j = 0; j < N; j++) {
        System.out.print(matrix[i][j]);
        if (j != N - 1)
            System.out.print(" ");
    }
    System.out.println();
}
System.out.println();   // Extra blank line after each test case
      }
  }
}`,
    hints: [
      {
        title: "Two-Step 90° Clockwise Rotation",
        text: "1) <strong>Transpose</strong> the matrix: swap <code>matrix[i][j]</code> and <code>matrix[j][i]</code> for all <code>j &gt;= i</code>.<br/>2) <strong>Reverse each row</strong>: swap <code>matrix[i][j]</code> with <code>matrix[i][N - 1 - j]</code> for <code>j</code> from 0 to <code>N/2 - 1</code>."
      },
      {
        title: "Formatting Output",
        text: "Print each row with space separation, omitting the trailing space at the end of each row, and print an extra newline between test cases."
      }
    ],
    sampleCases: [
      {
        id: 1,
        input: "3\n3\n1 2 3\n4 5 6\n7 8 9\n2\n2 4\n1 3\n1\n14",
        expected: "7 4 1\n8 5 2\n9 6 3\n\n1 2\n3 4\n\n14\n",
        explanation: "Matrices of sizes 3x3, 2x2, and 1x1 rotated 90 degrees clockwise."
      }
    ],
    edgeCases: [
      {
        id: 2,
        input: "1\n4\n1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15 16",
        expected: "13 9 5 1\n14 10 6 2\n15 11 7 3\n16 12 8 4\n",
        explanation: "4x4 matrix rotated 90 degrees clockwise."
      }
    ]
  },
  q07_string_length: {
    id: "q07_string_length",
    num: "07",
    title: "String length",
    tag: "Strings",
    category: "Strings",
    subtitle: "String Length Calculation",
    brief: `Given a string, find its length. For example, "hello" contains 5 characters, "hi" contains 2 characters.

Input Format
First line contains single integer t, the number of test-cases. 
Each of next t lines contains a string of lowercase alphabets.

Output Format
Output t lines, each containing the single integer, length of corresponding string.

Constraints:
1 <= t <= 100
1 <= length of string <= 100`,
    inputFormat: "First line contains single integer t, the number of test-cases. Each of next t lines contains a string of lowercase alphabets.",
    outputFormat: "Output t lines, each containing the single integer, length of corresponding string.",
    starterCode: `import java.util.Scanner;
class Main{
    public static void main(String[] args)
    {
        // Write your code here
        
        
        
    }
}`,
    solutionCode: `import java.util.Scanner;
class Main{
    public static void main(String[] args)
    {
        Scanner sc = new Scanner(System.in);
        int t = sc.nextInt();
        for(int i=0; i<t;i++){
            String str = sc.next();
            System.out.println(str.length());
        }
    }
}`,
    hints: [
      {
        title: "Read Testcases",
        text: "Read the number of test cases with <code>int t = sc.nextInt();</code> and run a loop from <code>0</code> to <code>t</code>."
      },
      {
        title: "Read Word & Print Length",
        text: "Read each string using <code>String str = sc.next();</code> and output its length with <code>System.out.println(str.length());</code>"
      }
    ],
    sampleCases: [
      {
        id: 1,
        input: "2\nhello\ncodequotient",
        expected: "5\n12",
        explanation: "\"hello\" has length 5, and \"codequotient\" has length 12."
      },
      {
        id: 2,
        input: "3\na\nprogramming\njava",
        expected: "1\n11\n4",
        explanation: "Lengths of strings \"a\", \"programming\", and \"java\" are 1, 11, and 4."
      }
    ],
    edgeCases: [
      {
        id: 3,
        input: "1\nabcdefghijklmnopqrstuvwxyz",
        expected: "26",
        explanation: "All 26 letters of the alphabet."
      }
    ]
  },
  q08_implement_strcmp_function: {
    id: "q08_implement_strcmp_function",
    num: "08",
    title: "Implement strcmp function",
    tag: "String Comparison",
    category: "Strings",
    subtitle: "Custom Lexicographical String Comparison",
    brief: `Write your own implementation of strcmp function. The function will take two strings as arguments and compare them character by character and return an integer value as under:

• 0 : if both strings are identical (equal)
• Negative : if the ASCII value of first unmatched character in first string is less than second string.
• Positive : if the ASCII value of first unmatched character in first string is greater than second string.

Complete the function int strcmp(str1, str2) that will take two strings as parameters and compare them. The function must return 0 if the strings are equal. Else function must return the difference between the ASCII value of unmatched character.

Input Format:
The first line of input contains an integer T denoting the no of test cases. 
Then T test cases follow. Each test case contains two strings str1 and str2. 

Output Format:
For each test case, print the result of comparison of strings in new lines.`,
    inputFormat: "The first line of input contains an integer T. Then T test cases follow, each containing two strings str1 and str2.",
    outputFormat: "For each test case, print the result of comparison of strings in new lines.",
    starterCode: `import java.util.Scanner;

class Result {
  static int strcmp(String str1, String str2) {
    // Write your code here
    
      
      
  }
}

class Main{
    public static void main(String[] args){
        Scanner in = new Scanner(System.in);
        int t = in.nextInt();
        while(t-- > 0){
            String a = in.next();
            String b = in.next();

            System.out.println(Result.strcmp(a,b));

        }
    }
}`,
    solutionCode: `import java.util.Scanner;

class Result {
  static int strcmp(String str1, String str2) {
    int i = 0;
    while (i < str1.length() && i < str2.length()) {
      if (str1.charAt(i) != str2.charAt(i)) {
        return str1.charAt(i) - str2.charAt(i);
      }
      i++;
    }
    return str1.length() - str2.length();
  }
}

class Main{
    public static void main(String[] args){
        Scanner in = new Scanner(System.in);
        int t = in.nextInt();
        while(t-- > 0){
            String a = in.next();
            String b = in.next();

            System.out.println(Result.strcmp(a,b));

        }
    }
}`,
    hints: [
      {
        title: "Character-by-Character Comparison",
        text: "Traverse both strings with an index <code>i</code> while <code>i &lt; str1.length() &amp;&amp; i &lt; str2.length()</code>. Compare <code>str1.charAt(i)</code> with <code>str2.charAt(i)</code>. If they differ, return <code>str1.charAt(i) - str2.charAt(i)</code>."
      },
      {
        title: "Length Difference for Prefixes",
        text: "If all compared characters are equal, return the difference in lengths: <code>return str1.length() - str2.length();</code>"
      }
    ],
    sampleCases: [
      {
        id: 1,
        input: "2\nCoding Coding\nprogramming Programming",
        expected: "0\n32",
        explanation: "\"Coding\" vs \"Coding\" are identical (0). 'p' (ASCII 112) - 'P' (ASCII 80) = 32."
      }
    ],
    edgeCases: [
      {
        id: 2,
        input: "3\nApple Banana\nCode CodeQuotient\nZebra Ant",
        expected: "-1\n-8\n25",
        explanation: "'A' - 'B' = -1. 'Code' vs 'CodeQuotient' prefix difference = 4 - 12 = -8. 'Z' - 'A' = 25."
      }
    ]
  },
  q09_implement_strcat_function: {
    id: "q09_implement_strcat_function",
    num: "09",
    title: "Implement strcat function",
    tag: "String Concatenation",
    category: "Strings",
    subtitle: "Custom String Concatenation Function",
    brief: `Implement the strcat() function from string library as your own function. The function will take two strings as arguments and concatenate the second string at the end of first string.

Function strcatCode(str1, str2) will take two parameters and concatenate the str2 string at end of str1.

Input Format:
The first line of input contains an integer T denoting the number of test cases. 
Then T test cases follow. Each test case contains two strings str1 and str2. 

Output Format:
For each test case, print the concatenated string in new lines.`,
    inputFormat: "First line contains integer T. Then T test cases follow, each containing two strings a and b.",
    outputFormat: "For each test case, print the concatenated string on a new line.",
    starterCode: `import java.util.Scanner;
class Main
{
static String strcatCode(String a, String b) {
  // Write your code here
  
    
    
}
public static void main(String[] args)
    {
        Scanner in = new Scanner(System.in);
        int t = in.nextInt();
        while(t-- > 0){
            String a = in.next();
            String b = in.next();
            String c = strcatCode(a,b);
            System.out.println(c);
        }
    }
}`,
    solutionCode: `import java.util.Scanner;
class Main
{
static String strcatCode(String a, String b) {
  // Write your code here
  return a + b;
}
    public static void main(String[] args)
    {
        Scanner in = new Scanner(System.in);
        int t = in.nextInt();
        while(t-- > 0){
            String a = in.next();
            String b = in.next();
            String c = strcatCode(a,b);
            System.out.println(c);
        }
    }
}`,
    hints: [
      {
        title: "Concatenation in Java",
        text: "You can concatenate strings using the <code>+</code> operator: <code>return a + b;</code> or <code>return a.concat(b);</code>"
      }
    ],
    sampleCases: [
      {
        id: 1,
        input: "1\nCode Quotient",
        expected: "CodeQuotient",
        explanation: "Concatenates \"Code\" and \"Quotient\" into \"CodeQuotient\"."
      },
      {
        id: 2,
        input: "2\nHello World\nJava Programming",
        expected: "HelloWorld\nJavaProgramming",
        explanation: "Concatenates \"Hello\" + \"World\" and \"Java\" + \"Programming\"."
      }
    ],
    edgeCases: [
      {
        id: 3,
        input: "1\nOpen AI",
        expected: "OpenAI",
        explanation: "\"Open\" + \"AI\" = \"OpenAI\"."
      }
    ]
  },
  q10_unique_characters_or_not: {
    id: "q10_unique_characters_or_not",
    num: "10",
    title: "Unique characters or not",
    tag: "String Analysis",
    category: "Strings",
    subtitle: "Duplicate Character Detection",
    brief: `Given a string, you need to test the characters for their uniqueness. If all the characters occur at most 1 time in the string, then print "YES", otherwise if some character occurs at least twice in the string print "NO".

Function isUniqueChars(String str) will take the string as parameter and return true if all characters are unique, else return false.

Input Format:
The first line of input contains an integer T denoting the number of test cases. Then T test cases follow. Each test case contains the string str. 

Output Format:
For each test case, print YES or NO in new lines.

Constraints:
1 <= T <= 10
Given string can contain any valid ASCII character.`,
    inputFormat: "First line contains integer T. Then T test cases follow, each containing a string str.",
    outputFormat: "For each test case, print YES or NO in new lines.",
    starterCode: `import java.util.Scanner;
class Result{
  // Return true if string contains all unique characters, else return false
  static boolean isUniqueChars(String str){
    // Write your code here
      
      
      
  }
}
class Main{
  public static void main(String[] args){
    Scanner in = new Scanner(System.in);
    int t = in.nextInt();
    while(t-- > 0){
      String str = in.next();
      if(Result.isUniqueChars(str)){
        System.out.println("YES");
      }else{
        System.out.println("NO");
      }
    }
  }
}`,
    solutionCode: `import java.util.Scanner;
class Result {
  // Return true if string contains all unique characters, else return false
  static boolean isUniqueChars(String str) {
    for (int i = 0; i < str.length(); i++) {
      char ch = str.charAt(i);
      // If first appearance is not the same as last appearance, it's a duplicate
      if (str.indexOf(ch) != str.lastIndexOf(ch)) {
        return false;
      }
    }
    return true;
  }
}
class Main{
  public static void main(String[] args){
    Scanner in = new Scanner(System.in);
    int t = in.nextInt();
    while(t-- > 0){
      String str = in.next();
      if(Result.isUniqueChars(str)){
        System.out.println("YES");
      }else{
        System.out.println("NO");
      }
    }
  }
}`,
    hints: [
      {
        title: "Check First vs Last Index",
        text: "For each character <code>char ch = str.charAt(i)</code>, verify if <code>str.indexOf(ch) != str.lastIndexOf(ch)</code>. If they differ, the character occurs multiple times."
      },
      {
        title: "All Unique",
        text: "If no duplicates are detected throughout the entire string, return <code>true</code>."
      }
    ],
    sampleCases: [
      {
        id: 1,
        input: "2\nCodeQuotient\nCoding",
        expected: "NO\nYES",
        explanation: "\"CodeQuotient\" contains duplicate letters ('o', 'e', 't') -> NO. \"Coding\" has unique characters -> YES."
      }
    ],
    edgeCases: [
      {
        id: 2,
        input: "3\na\nabcdef\naA",
        expected: "YES\nYES\nYES",
        explanation: "Single characters, distinct alphabets, and case-sensitive ASCII ('a' vs 'A') are all unique."
      },
      {
        id: 3,
        input: "2\naa\nabacaba",
        expected: "NO\nNO",
        explanation: "Repeating 'a's and 'b's produce NO."
      }
    ]
  },
  q11_string_is_palindrome_or_not: {
    id: "q11_string_is_palindrome_or_not",
    num: "11",
    title: "String is palindrome or not",
    tag: "Palindrome",
    category: "Strings",
    subtitle: "String Reversal & Palindrome Verification",
    brief: `Given a string, you need to test if it is palindrome or not. If the string is palindrome print "YES", otherwise print "NO".

Function isPalindrome(String str) will take the string as parameter and return true if it is a palindrome, else return false.

Input Format:
The first line of input contains an integer T denoting the number of test cases. Then T test cases follow. Each test case contains the string str.

Output Format:
For each test case, print YES or NO in new lines.

Constraints:
1 <= T <= 10
Given string consists of uppercase and lowercase English letters.`,
    inputFormat: "The first line contains integer T. Then T test cases follow, each containing a string str.",
    outputFormat: "For each test case, print YES or NO in new lines.",
    starterCode: `import java.util.Scanner;
class Result{
  // Return true if the string is palindrome, else return false
  static boolean isPalindrome(String str) {
    // Write your code here
    
      
      
  }
}
class Main{
    public static void main(String[] args)
    {
      Scanner in = new Scanner(System.in);
      int t = in.nextInt();
      for(int i = 0;i<t;i++){
        String str = in.next();
        if(Result.isPalindrome(str)){
          System.out.println("YES");
        }else{
          System.out.println("NO");
        }
      }
    }
}`,
    solutionCode: `import java.util.Scanner;
class Result {
  // Return true if the string is palindrome, else return false
  static boolean isPalindrome(String str) {
      String rev = new StringBuilder(str).reverse().toString();
      return str.equals(rev);
  }
}
class Main{
    public static void main(String[] args)
    {
      Scanner in = new Scanner(System.in);
      int t = in.nextInt();
      for(int i = 0;i<t;i++){
        String str = in.next();
        if(Result.isPalindrome(str)){
          System.out.println("YES");
        }else{
          System.out.println("NO");
        }
      }
    }
}`,
    hints: [
      {
        title: "StringBuilder Reverse",
        text: "Reverse the string using <code>new StringBuilder(str).reverse().toString()</code>."
      },
      {
        title: "Compare with Original",
        text: "Check equality using <code>return str.equals(rev);</code> (Note: use <code>.equals()</code> for string value comparison in Java)."
      }
    ],
    sampleCases: [
      {
        id: 1,
        input: "2\nCoding\ncooc",
        expected: "NO\nYES",
        explanation: "\"Coding\" reversed is \"gnidoC\" != \"Coding\" (NO). \"cooc\" reversed is \"cooc\" == \"cooc\" (YES)."
      }
    ],
    edgeCases: [
      {
        id: 2,
        input: "3\na\nracecar\nAbba",
        expected: "YES\nYES\nNO",
        explanation: "Single char 'a' is palindrome. 'racecar' is palindrome. 'Abba' reversed is 'abbA' which is not equal (case-sensitive)."
      }
    ]
  },
  q12_count_words: {
    id: "q12_count_words",
    num: "12",
    title: "Count words",
    tag: "String Tokenization",
    category: "Strings",
    subtitle: "Word Counting & Multi-Space Delimiter Handling",
    brief: `Write a function countWords() to count the number of words in a string.

A word is defined as text separated by space (' ') or multiple spaces.

The function will receive a string as input and return the number of words in this string.

Input Format:
A single line of input which consists of the string whose words are to be counted.

Output Format:
Print the count of the number of words in the string.`,
    inputFormat: "A single line containing the string text.",
    outputFormat: "Print the total word count as an integer.",
    starterCode: `import java.util.*;
class Result {
  static int countWords(String str) {
    // Write your code here
    
      
      
  }
}
class Main
{
  public static void main(String[] args)
  {
    String t;
    Scanner s=new Scanner(System.in);
    t=s.nextLine();
    System.out.println(Result.countWords(t));
  }
}`,
    solutionCode: `import java.util.*;
class Result {
  static int countWords(String str) {
    int count = 0;
    for (String word : str.split(" ")) {
      if (word.length() > 0) {
        count++;
      }
    }
    return count;
  }
}
class Main
{
  public static void main(String[] args)
  {
    String t;
    Scanner s=new Scanner(System.in);
    t=s.nextLine();
    System.out.println(Result.countWords(t));
  }
}`,
    hints: [
      {
        title: "Split by Spaces",
        text: "Split the string with <code>str.split(\" \")</code> or <code>str.trim().split(\"\\\\s+\")</code> and count tokens whose <code>word.length() &gt; 0</code>."
      }
    ],
    sampleCases: [
      {
        id: 1,
        input: "Codequotient get better  at coding",
        expected: "5",
        explanation: "5 words: [Codequotient, get, better, at, coding]."
      }
    ],
    edgeCases: [
      {
        id: 2,
        input: "Java",
        expected: "1",
        explanation: "Single word string."
      },
      {
        id: 3,
        input: "   multiple   spaces   between   words   ",
        expected: "4",
        explanation: "4 words despite leading, trailing, and duplicate spaces."
      }
    ]
  },
  q13_reverse_the_words_of_a_string: {
    id: "q13_reverse_the_words_of_a_string",
    num: "13",
    title: "Reverse the words of a string",
    tag: "String Manipulation",
    category: "Strings",
    subtitle: "In-Place Individual Word Reversal",
    brief: `A string is composed of words separated by space delimiter.

Given a string (with space as a delimiter between words), reverse the words in the string individually, not the whole string.

Complete the function revWordsString() which takes the string as parameter and reverses the individual words of the string and prints them.

Input Format:
The first line of input contains an integer T denoting the number of test cases. 
Each test case contains one line with a string.

Output Format:
For each test case, print the resultant string in new lines.`,
    inputFormat: "First line contains integer T. Then T test cases follow, each containing a string.",
    outputFormat: "For each test case, print the string with each individual word reversed.",
    starterCode: `import java.util.*;
class Result {
  static void revWordsString(String str) {
    // Write your code here
    
      
      
  }
}
class Main {
  public static void main(String[] args) {
    Scanner s = new Scanner(System.in);
    int t,i,j=0;
    t = Integer.parseInt(s.nextLine().trim());
    String str;
    while(t-- > 0)
    {
      str = s.nextLine();
      Result.revWordsString(str);
    }
  }
}`,
    solutionCode: `import java.util.*;
class Result {
  static void revWordsString(String str) {
    String result = "";
    for (String word : str.split(" ")) {
        String rev = new StringBuilder(word).reverse().toString();
        result = result + rev + " ";
    }
    System.out.println(result.trim());
  }
}
class Main {
  public static void main(String[] args) {
    Scanner s = new Scanner(System.in);
    int t,i,j=0;
    t = Integer.parseInt(s.nextLine().trim());
    String str;
    while(t-- > 0)
    {
      str = s.nextLine();
      Result.revWordsString(str);
    }
  }
}`,
    hints: [
      {
        title: "Split & Invert Tokens",
        text: "Iterate over <code>str.split(\" \")</code>, reverse each individual word with <code>new StringBuilder(word).reverse().toString()</code>, and concatenate them with spaces."
      },
      {
        title: "Trim Output",
        text: "Print using <code>result.trim()</code> to remove any trailing blank space."
      }
    ],
    sampleCases: [
      {
        id: 1,
        input: "2\nCode Quotient Loves Code\nHello Coders",
        expected: "edoC tneitouQ sevoL edoC\nolleH sredoC",
        explanation: "Reverses each word individually: Code -> edoC, Quotient -> tneitouQ, Loves -> sevoL, Code -> edoC. Hello -> olleH, Coders -> sredoC."
      }
    ],
    edgeCases: [
      {
        id: 2,
        input: "1\na b c d",
        expected: "a b c d",
        explanation: "Single characters remain identical when reversed."
      }
    ]
  }
};
