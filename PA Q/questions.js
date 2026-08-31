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
  },
  q14_find_all_pairs_with_sum_k: {
    id: "q14_find_all_pairs_with_sum_k",
    num: "14",
    title: "Find all pairs with sum K",
    tag: "Two Pointers",
    category: "Searching Sorting in Arrays",
    subtitle: "Two-Pointer Pair Sum in Sorted Array",
    brief: `Given a sorted list of N integers, find all distinct pairs of integers in the list with sum equal to a given number K, with O(n log n) or O(n) time complexity.

Complete the function getPairsCount(int arr[], int n, int k) which takes the array and K as parameters and returns the number of pairs if any and 0 otherwise.

Input Format:
First line of input will contain a positive integer T = number of test cases. Each test case will contain 2 lines:
• First line of each test case contains two integers - N and K. 
• Next line will contain N numbers separated by space in non-decreasing order.

Output Format:
For each test case, print number of distinct pairs whose sum will be equal to k. A pair must have two numbers at different indices. 
Two pairs are different if at least one of the indices in them is uncommon.

Constraints:
1 <= T <= 10
1 <= N <= 10^5
-(10^9) <= arr[i], K <= 10^9`,
    inputFormat: "First line contains T. For each test case: two integers N and K, followed by N space-separated integers in non-decreasing order.",
    outputFormat: "For each test case, print the number of distinct pairs whose sum equals K.",
    starterCode: `import java.util.*;
class Result {
  static int getPairsCount(int arr[], int n, int k) {
    // Write your code here
    
      
      
  }
}
class Main
{
  public static void main(String[] args)
  {
    int i,T, n, k;
    Scanner s1=new Scanner(System.in);
    T=Integer.parseInt(s1.nextLine().trim());
    while(T > 0)
    {
      T--;
      n = s1.nextInt();
      k = s1.nextInt();
      int a[] = new int[n];
      for(i=0;i<n;i++)
        a[i] = s1.nextInt();
      System.out.println(Result.getPairsCount(a, n, k));
    }
  }
}`,
    solutionCode: `import java.util.*;
class Result {
  static int getPairsCount(int arr[], int n, int k) {
    int left = 0;
    int right = n - 1;
    int count = 0;
    while (left < right) {
      long sum = (long) arr[left] + arr[right];
      if (sum == k) {
        count++;
        left++;
        right--;
      } else if (sum < k) {
        left++;
      } else {
        right--;
      }
    }
    return count;
  }
}
class Main
{
  public static void main(String[] args)
  {
    int i,T, n, k;
    Scanner s1=new Scanner(System.in);
    T=Integer.parseInt(s1.nextLine().trim());
    while(T > 0)
    {
      T--;
      n = s1.nextInt();
      k = s1.nextInt();
      int a[] = new int[n];
      for(i=0;i<n;i++)
        a[i] = s1.nextInt();
      System.out.println(Result.getPairsCount(a, n, k));
    }
  }
}`,
    hints: [
      {
        title: "Two-Pointer Strategy",
        text: "Since the array is sorted, place <code>left = 0</code> and <code>right = n - 1</code>. If <code>arr[left] + arr[right] == k</code>, record pair and move both pointers inward. If sum &lt; k, do <code>left++</code>; if sum &gt; k, do <code>right--</code>."
      }
    ],
    sampleCases: [
      {
        id: 1,
        input: "3\n10 11\n1 2 3 4 5 6 7 8 9 10\n5 10\n2 4 6 8 10\n6 27\n12 15 20 22 34 36",
        expected: "5\n2\n1",
        explanation: "Test 1: (1,10), (2,9), (3,8), (4,7), (5,6) -> 5 pairs. Test 2: (2,8), (4,6) -> 2 pairs. Test 3: (12,15) -> 1 pair."
      }
    ],
    edgeCases: [
      {
        id: 2,
        input: "1\n5 50\n1 2 3 4 5",
        expected: "0",
        explanation: "No two elements sum up to 50."
      }
    ]
  },
  q15_find_first_occurrence_of_an_integer_in_a_sorted_list_with_duplicates: {
    id: "q15_find_first_occurrence_of_an_integer_in_a_sorted_list_with_duplicates",
    num: "15",
    title: "Find first occurrence of an integer in a sorted list with duplicates",
    tag: "Binary Search",
    category: "Searching Sorting in Arrays",
    subtitle: "Binary Search Lower Bound & First Index",
    brief: `Given a sorted list of integers, find the position of first occurrence of a given number K in the list in O(log n) time.

Input Format:
First line of input will contain a positive integer T = number of test cases.
Each test case will contain the following two lines:
• First line will contain two positive integer N = number of elements in list and K.
• Second line will contain N space separated integers in increasing order.

Output Format:
For each test case, print on a single line the index of first occurrence of K in the list on 0-based index. Print -1 if you cannot find K in the list.

Constraints:
1 <= N <= 10^5
-(10^9) <= arr[i], K <= (10^9)`,
    inputFormat: "First line contains integer T. Each test case has two lines: N and K, followed by N sorted integers.",
    outputFormat: "For each test case, print the 0-based index of the first occurrence of K, or -1 if not found.",
    starterCode: `import java.util.Scanner;
class Main{
    public static void main(String[] args)
    {
        // Write your code here
        
        
        
        
    }
}`,
    solutionCode: `import java.util.Scanner;
class Main{
    static int findFirstOccurrence(int[] arr, int n, int k) {
        int low = 0, high = n - 1;
        int ans = -1;
        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (arr[mid] == k) {
                ans = mid;
                high = mid - 1;
            } else if (arr[mid] < k) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return ans;
    }

    public static void main(String[] args)
    {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int t = sc.nextInt();
        while (t-- > 0) {
            int n = sc.nextInt();
            int k = sc.nextInt();
            int[] arr = new int[n];
            for (int i = 0; i < n; i++) {
                arr[i] = sc.nextInt();
            }
            System.out.println(findFirstOccurrence(arr, n, k));
        }
    }
}`,
    hints: [
      {
        title: "Binary Search with Left Bias",
        text: "When <code>arr[mid] == k</code>, save <code>ans = mid</code> and shift left: <code>high = mid - 1</code> to search for earlier occurrences."
      }
    ],
    sampleCases: [
      {
        id: 1,
        input: "3\n10 4\n1 2 4 4 4 4 5 8 9 10\n15 7\n1 2 3 3 5 6 7 7 7 7 7 8 8 8 8\n9 1\n-5 -4 -3 -2 -1 0 0 0 1",
        expected: "2\n6\n8",
        explanation: "First 4 is at index 2. First 7 is at index 6. First 1 is at index 8."
      }
    ],
    edgeCases: [
      {
        id: 2,
        input: "1\n5 100\n1 2 3 4 5",
        expected: "-1",
        explanation: "100 is not in the array."
      }
    ]
  },
  q16_find_count_of_a_number_in_a_sorted_list_with_duplicates: {
    id: "q16_find_count_of_a_number_in_a_sorted_list_with_duplicates",
    num: "16",
    title: "Find count of a number in a sorted list with duplicates",
    tag: "Binary Search",
    category: "Searching Sorting in Arrays",
    subtitle: "Element Frequency via Binary Search",
    brief: `Given a sorted list of integers with duplicates, find the count of a given number K in that list in O(log n) time.

Input Format:
First line of input will contain a positive integer T = number of test cases. Each test case will contain 2 lines:
• First line of each test case will contain two number N = number of elements in list and K separated by space. 
• Next line will contain N space separated integers.

Output Format:
For each test case, print on a single line, the count of number K in this list.

Constraints:
1 <= N <= 10^5
-(10^9) <= arr[i], K <= (10^9)`,
    inputFormat: "First line contains T. Each test case has two numbers N and K, followed by N space-separated integers.",
    outputFormat: "Print the total frequency of number K in the list.",
    starterCode: `import java.util.Scanner;
class Main{
    public static void main(String[] args)
    {
        // Write your code here
        
        
        
        
    }
}`,
    solutionCode: `import java.util.Scanner;
class Main{
    static int findFirst(int[] arr, int n, int k) {
        int low = 0, high = n - 1, ans = -1;
        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (arr[mid] == k) {
                ans = mid;
                high = mid - 1;
            } else if (arr[mid] < k) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return ans;
    }

    static int findLast(int[] arr, int n, int k) {
        int low = 0, high = n - 1, ans = -1;
        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (arr[mid] == k) {
                ans = mid;
                low = mid + 1;
            } else if (arr[mid] < k) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return ans;
    }

    public static void main(String[] args)
    {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int t = sc.nextInt();
        while (t-- > 0) {
            int n = sc.nextInt();
            int k = sc.nextInt();
            int[] arr = new int[n];
            for (int i = 0; i < n; i++) {
                arr[i] = sc.nextInt();
            }
            int first = findFirst(arr, n, k);
            if (first == -1) {
                System.out.println(0);
            } else {
                int last = findLast(arr, n, k);
                System.out.println(last - first + 1);
            }
        }
    }
}`,
    hints: [
      {
        title: "Find First and Last Index",
        text: "Perform binary search twice: once for the first occurrence index, once for the last occurrence index. The count is <code>last - first + 1</code>."
      }
    ],
    sampleCases: [
      {
        id: 1,
        input: "3\n10 5\n1 2 2 5 5 5 7 7 7 8\n10 1\n1 1 1 1 1 1 1 2 2 3\n20 2\n1 1 1 1 1 2 2 2 2 2 3 3 3 3 3 4 4 4 4 4",
        expected: "3\n7\n5",
        explanation: "5 occurs 3 times. 1 occurs 7 times. 2 occurs 5 times."
      }
    ],
    edgeCases: [
      {
        id: 2,
        input: "1\n5 99\n1 2 3 4 5",
        expected: "0",
        explanation: "Element 99 is not present."
      }
    ]
  },
  q17_search_element_in_a_rotated_sorted_array: {
    id: "q17_search_element_in_a_rotated_sorted_array",
    num: "17",
    title: "Search element in a rotated sorted array",
    tag: "Binary Search",
    category: "Searching Sorting in Arrays",
    subtitle: "Pivoted Binary Search in Rotated Sorted Array",
    brief: `Given an array of n integers which is sorted but rotated by some number of times after sorting, and an integer k. Search the element k in this sorted rotated array efficiently in O(log N) time and O(1) space.

Assume there are no duplicate elements in the array.

Complete the function searchRotatedSortedArray() to search a value target in array arr of size given, and if target is found in the array return its index, otherwise return -1.

Input Format:
First line of input will contain a number T = number of test cases. Each test case will contain 3 lines:
• The first line will contain an integer k to be searched. 
• Second line will contain a number n = number of elements in the array. 
• Next line will contain N space separated integers.

Output Format:
Print the index of k in given array for each test case in new line if found and print -1 if k is not present.

Constraints:
1 <= T <= 10
-1000 <= k <= 1000
1 <= n <= 10^5
-1000 <= arr[i] <= 1000`,
    inputFormat: "First line contains T. For each test case: target integer k, size n, and n space-separated integers.",
    outputFormat: "Print the 0-based index of k, or -1 if not found.",
    starterCode: `import java.util.Scanner;
class Result {
  static int searchRotatedSortedArray(int arr[], int k) {
    // Write your code here
    
      
      
      
  }
}
class Main{
  public static void main(String[] args)
  {
    int T, i, size = 0,target;
    String sp;
    Scanner s=new Scanner(System.in);
    T = Integer.parseInt(s.nextLine().trim());
    while(T > 0)
    {
      T--;
      target = s.nextInt();
      size = s.nextInt();
      int arr[] = new int[size];
      for( i = 0; i < size; i++) 
        arr[i] = s.nextInt();
      System.out.println(Result.searchRotatedSortedArray(arr, target));
    }
  }
}`,
    solutionCode: `import java.util.Scanner;
class Result {
  static int searchRotatedSortedArray(int arr[], int k) {
    int low = 0, high = arr.length - 1;
    while (low <= high) {
      int mid = low + (high - low) / 2;
      if (arr[mid] == k) return mid;

      if (arr[low] <= arr[mid]) {
        if (k >= arr[low] && k < arr[mid]) {
          high = mid - 1;
        } else {
          low = mid + 1;
        }
      } else {
        if (k > arr[mid] && k <= arr[high]) {
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
    }
    return -1;
  }
}
class Main{
  public static void main(String[] args)
  {
    int T, i, size = 0,target;
    String sp;
    Scanner s=new Scanner(System.in);
    T = Integer.parseInt(s.nextLine().trim());
    while(T > 0)
    {
      T--;
      target = s.nextInt();
      size = s.nextInt();
      int arr[] = new int[size];
      for( i = 0; i < size; i++) 
        arr[i] = s.nextInt();
      System.out.println(Result.searchRotatedSortedArray(arr, target));
    }
  }
}`,
    hints: [
      {
        title: "Check Sorted Half",
        text: "Determine if the left half <code>arr[low] &lt;= arr[mid]</code> is sorted or right half is sorted. Then check if <code>k</code> falls in that range to decide the next search interval."
      }
    ],
    sampleCases: [
      {
        id: 1,
        input: "2\n3\n6\n15 18 2 3 6 12\n7\n7\n4 5 8 9 1 2 3",
        expected: "3\n-1",
        explanation: "3 is found at index 3 in [15, 18, 2, 3, 6, 12]. 7 is not present -> -1."
      }
    ],
    edgeCases: [
      {
        id: 2,
        input: "1\n1\n1\n1",
        expected: "0",
        explanation: "Single element found at index 0."
      }
    ]
  },
  q18_find_missing_element: {
    id: "q18_find_missing_element",
    num: "18",
    title: "Find Missing Element",
    tag: "Bit Manipulation",
    category: "Searching Sorting in Arrays",
    subtitle: "XOR Accumulation for Missing Shuffled Number",
    brief: `There is an array of non-negative integers. A second array is formed by shuffling the elements of the first array and deleting a random element. Given these two arrays, find which element is missing in the second array.

Function getMissingElement(int[] A, int[] B) takes both arrays as parameters and returns the missing element.

Input Format:
First line of input will contain a positive integer T = number of test cases. Each test case will contain 3 lines:
• First line of each test case will contain two numbers: m = size of first array, and n = size of second array.
• Next 2 lines will contain m and n space-separated non-negative integers.

Output Format:
For each test case, print the missing element in the second array.

Constraints:
0 <= T <= 10
2 <= m <= 10^5
n = m - 1
0 <= A[i], B[i] <= 10^4`,
    inputFormat: "First line contains T. Each test case contains m and n, followed by array A elements and array B elements.",
    outputFormat: "For each test case, print the single missing integer.",
    starterCode: `import java.util.*;
class Result {
  static int getMissingElement(int[] A, int[] B) {
    // Write your code here
    
      
      
      
  }
}

class Main{
  public static void main(String[] args){
    Scanner in = new Scanner(System.in);
    int T = in.nextInt();
    while(T-- > 0){
      int n = in.nextInt();
      int m = in.nextInt();
      int a[] = new int[n];
      int b[] = new int[m];
      for(int i = 0;i<n;i++){
        a[i] = in.nextInt();
      }
      for(int i = 0;i<m;i++){
        b[i] = in.nextInt();
      }
      System.out.println(Result.getMissingElement(a,b));
    }
  }
}`,
    solutionCode: `import java.util.*;
class Result {
  static int getMissingElement(int[] A, int[] B) {
    int xor = 0;
    for (int num : A) {
      xor ^= num;
    }
    for (int num : B) {
      xor ^= num;
    }
    return xor;
  }
}

class Main{
  public static void main(String[] args){
    Scanner in = new Scanner(System.in);
    int T = in.nextInt();
    while(T-- > 0){
      int n = in.nextInt();
      int m = in.nextInt();
      int a[] = new int[n];
      int b[] = new int[m];
      for(int i = 0;i<n;i++){
        a[i] = in.nextInt();
      }
      for(int i = 0;i<m;i++){
        b[i] = in.nextInt();
      }
      System.out.println(Result.getMissingElement(a,b));
    }
  }
}`,
    hints: [
      {
        title: "XOR All Numbers",
        text: "XOR of a number with itself is <code>0</code> (<code>x ^ x = 0</code>). XORing all elements in array A and array B leaves only the single missing element in <code>O(N)</code> time."
      }
    ],
    sampleCases: [
      {
        id: 1,
        input: "1\n5 4\n1 2 3 4 5\n3 4 1 2",
        expected: "5",
        explanation: "5 is present in array A but absent in array B."
      }
    ],
    edgeCases: [
      {
        id: 2,
        input: "2\n2 1\n10 20\n20\n3 2\n0 1 2\n2 0",
        expected: "10\n1",
        explanation: "10 is missing in test 1. 1 is missing in test 2."
      }
    ]
  },
  q19_find_the_number_of_swaps_in_bubble_sort: {
    id: "q19_find_the_number_of_swaps_in_bubble_sort",
    num: "19",
    title: "Find the number of swaps in Bubble Sort",
    tag: "Sorting Algorithms",
    category: "Searching Sorting in Arrays",
    subtitle: "Bubble Sort Inversion Swap Counter",
    brief: `Given a list of integers with no duplicates, find out how many swaps it will take to sort the list in increasing order using Bubble sort.

Input Format:
First line of each test case will contain an integer T = number of test cases. Each test case will contain two lines:
• First line will contain a number N = no. of elements in the list.
• Next line will contain N space separated numbers.

Output Format:
For each test case, print on a single line, number of swaps required to sort the list in increasing order using Bubble sort.

Constraints:
1 <= T <= 10
1 <= N <= 50
0 <= arr[i] <= 10^9`,
    inputFormat: "First line contains integer T. Each test case contains N, followed by N space-separated integers.",
    outputFormat: "Print the total swap count performed by Bubble Sort.",
    starterCode: `import java.util.Scanner;
class Main{
    public static void main(String[] args)
    {
        // Write your code here
        
        
        
        
    }
}`,
    solutionCode: `import java.util.Scanner;
class Main{
    static int bubbleSortSwaps(int[] arr, int n) {
        int swaps = 0;
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                    swaps++;
                }
            }
        }
        return swaps;
    }

    public static void main(String[] args)
    {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int t = sc.nextInt();
        while (t-- > 0) {
            int n = sc.nextInt();
            int[] arr = new int[n];
            for (int i = 0; i < n; i++) {
                arr[i] = sc.nextInt();
            }
            System.out.println(bubbleSortSwaps(arr, n));
        }
    }
}`,
    hints: [
      {
        title: "Bubble Sort Swap Counter",
        text: "Simulate Bubble Sort with two nested loops. Whenever adjacent elements <code>arr[j] &gt; arr[j+1]</code>, swap them and increment a counter."
      }
    ],
    sampleCases: [
      {
        id: 1,
        input: "3\n5\n2 1 4 6 3\n10\n123 21 34 45 25 675 23 44 55 900\n1\n23",
        expected: "3\n16\n0",
        explanation: "[2, 1, 4, 6, 3] takes 3 swaps. 10-element array takes 16 swaps. 1-element array takes 0 swaps."
      }
    ],
    edgeCases: [
      {
        id: 2,
        input: "2\n4\n4 3 2 1\n4\n1 2 3 4",
        expected: "6\n0",
        explanation: "Reverse sorted takes 6 swaps. Already sorted takes 0 swaps."
      }
    ]
  },
  q20_find_the_numbers_of_shifts_in_insertion_sort: {
    id: "q20_find_the_numbers_of_shifts_in_insertion_sort",
    num: "20",
    title: "Find the numbers of shifts in Insertion sort",
    tag: "Sorting Algorithms",
    category: "Searching Sorting in Arrays",
    subtitle: "Insertion Sort Position Shift Counter",
    brief: `Given a list of integers, find out how many shifts it will take to sort the list using insertion sort algorithm.

Input:
First line of input will contain a positive integer T = number of test cases. Each test case will contain 2 lines:
• First line will contain a positive integer N = number of elements in a list.
• Next line will contain N space separated integers. There will be no duplicate in a list.

Output:
For each test case, print on a single line the total number of shifts performed while sorting the list using insertion sort algorithm. A shift is any change in position of an element in the list while performing insertion sort.`,
    inputFormat: "First line contains integer T. Each test case contains N, followed by N space-separated integers.",
    outputFormat: "For each test case, print the total number of shifts performed.",
    starterCode: `import java.util.Scanner;
class Main{
    public static void main(String[] args)
    {
        // Write your code here
        
        
        
    }
}`,
    solutionCode: `import java.util.Scanner;
class Main{
    static int insertionSortShifts(int[] arr, int n) {
        int shifts = 0;
        for (int i = 1; i < n; i++) {
            int key = arr[i];
            int j = i - 1;
            int rightShifts = 0;
            while (j >= 0 && arr[j] > key) {
                arr[j + 1] = arr[j];
                shifts++;
                rightShifts++;
                j--;
            }
            if (rightShifts > 0) {
                arr[j + 1] = key;
                shifts++;
            }
        }
        return shifts;
    }

    public static void main(String[] args)
    {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int t = sc.nextInt();
        while (t-- > 0) {
            int n = sc.nextInt();
            int[] arr = new int[n];
            for (int i = 0; i < n; i++) {
                arr[i] = sc.nextInt();
            }
            System.out.println(insertionSortShifts(arr, n));
        }
    }
}`,
    hints: [
      {
        title: "Counting Shifts",
        text: "In each step <code>i</code>, every element shifted right adds 1 shift. If at least one element moved, placing <code>arr[j + 1] = key</code> counts as 1 additional shift."
      }
    ],
    sampleCases: [
      {
        id: 1,
        input: "3\n5\n2 4 1 3 5\n10\n10 9 8 7 6 5 4 3 2 1\n5\n1 2 3 4 5",
        expected: "5\n54\n0",
        explanation: "[2, 4, 1, 3, 5] takes 5 shifts. Reverse sorted takes 54 shifts. Already sorted takes 0 shifts."
      }
    ],
    edgeCases: [
      {
        id: 2,
        input: "1\n2\n2 1",
        expected: "2",
        explanation: "1 right shift + 1 insertion placement = 2 shifts."
      }
    ]
  },
  q21_sort_an_array_using_merge_sort: {
    id: "q21_sort_an_array_using_merge_sort",
    num: "21",
    title: "Sort an array using merge sort",
    tag: "Divide & Conquer",
    category: "Searching Sorting in Arrays",
    subtitle: "Recursive Merge Sort & Subarray Merging",
    brief: `Given an array of N integers, sort them in ascending order using merge sort (a divide and conquer approach). Merge sort cuts the array in two halves, calls itself on these halves and then merges the two sorted halves recursively to make the whole array sorted.

Write the two functions mergeSort() and merge():
• mergeSort(int array[], int l, int r) divides array in half and calls itself recursively.
• merge(int array[], int l, int m, int r) merges the two sorted subarrays (array[l..m] and array[m+1..r]).

Input Format:
First line contains the number of elements N.
Second line contains the elements of array separated by space.

Output Format:
Print the elements of sorted array in ascending order.

Constraints:
1 <= N <= 10^5
-(10^9) <= arr[i] <= 10^9`,
    inputFormat: "First line contains integer N. Second line contains N space-separated integers.",
    outputFormat: "Print the sorted array elements separated by space.",
    starterCode: `import java.util.Scanner;
class Result {
  // Merges two subarrays of arr[]. 
  // First subarray is arr[l..m] and Second subarray is arr[m+1..r] 
  void merge(int array[], int l, int m, int r) {

  }

  /* l is for left index and r is right index of the sub-array of arr to be sorted */
  void mergeSort(int array[], int l, int r) {

  }
}
class Main{
  public static void main(String[] args)
  {
    int i,n;
    Scanner sc = new Scanner(System.in);
    if (!sc.hasNextInt()) return;
    n = sc.nextInt();
    int arr[] = new int[n];
    for(i=0;i<n;i++)
      arr[i] = sc.nextInt();

    Result o1 = new Result();
    o1.mergeSort(arr, 0, n-1); 
    for (i=0; i < n; i++) 
      System.out.print(arr[i] + (i == n - 1 ? "" : " "));
  }
}`,
    solutionCode: `import java.util.Scanner;
class Result {
  void merge(int array[], int l, int m, int r) {
    int n1 = m - l + 1;
    int n2 = r - m;

    int L[] = new int[n1];
    int R[] = new int[n2];

    for (int i = 0; i < n1; ++i)
      L[i] = array[l + i];
    for (int j = 0; j < n2; ++j)
      R[j] = array[m + 1 + j];

    int i = 0, j = 0;
    int k = l;
    while (i < n1 && j < n2) {
      if (L[i] <= R[j]) {
        array[k] = L[i];
        i++;
      } else {
        array[k] = R[j];
        j++;
      }
      k++;
    }

    while (i < n1) {
      array[k] = L[i];
      i++;
      k++;
    }

    while (j < n2) {
      array[k] = R[j];
      j++;
      k++;
    }
  }

  void mergeSort(int array[], int l, int r) {
    if (l < r) {
      int m = l + (r - l) / 2;
      mergeSort(array, l, m);
      mergeSort(array, m + 1, r);
      merge(array, l, m, r);
    }
  }
}
class Main{
  public static void main(String[] args)
  {
    int i,n;
    Scanner sc = new Scanner(System.in);
    if (!sc.hasNextInt()) return;
    n = sc.nextInt();
    int arr[] = new int[n];
    for(i=0;i<n;i++)
      arr[i] = sc.nextInt();

    Result o1 = new Result();
    o1.mergeSort(arr, 0, n-1); 
    for (i=0; i < n; i++) 
      System.out.print(arr[i] + (i == n - 1 ? "" : " "));
  }
}`,
    hints: [
      {
        title: "Divide & Conquer",
        text: "Recursively split array at <code>m = l + (r - l)/2</code>. Sort both halves with <code>mergeSort(array, l, m)</code> and <code>mergeSort(array, m + 1, r)</code>, then call <code>merge(array, l, m, r)</code>."
      }
    ],
    sampleCases: [
      {
        id: 1,
        input: "7\n1 3 5 7 2 4 9",
        expected: "1 2 3 4 5 7 9",
        explanation: "Array [1, 3, 5, 7, 2, 4, 9] sorted in ascending order."
      }
    ],
    edgeCases: [
      {
        id: 2,
        input: "5\n5 4 3 2 1",
        expected: "1 2 3 4 5",
        explanation: "Reverse sorted array sorted into [1, 2, 3, 4, 5]."
      }
    ]
  },
  q22_sort_an_array_using_quick_sort: {
    id: "q22_sort_an_array_using_quick_sort",
    num: "22",
    title: "Sort an array using quick sort",
    tag: "Divide & Conquer",
    category: "Searching Sorting in Arrays",
    subtitle: "Pivot Partitioning & Recursive Quick Sort",
    brief: `Given an array of N integers, sort them in ascending order using quick sort (a divide and conquer approach). It picks an element as pivot and partitions the given array around the picked pivot element recursively.

Write the two functions quickSort() and partition():
• partition(int array[], int low, int high) picks a pivot (e.g. array[high]), places it in its correct sorted position, and places all smaller elements to its left and greater elements to its right.
• quickSort(int array[], int low, int high) calls partition and recurses on both partitions.

Input Format:
First line contains the number of elements N.
Second line contains the elements of array separated by space.

Output Format:
Print the elements of sorted array in ascending order.

Constraints:
1 <= N <= 10^5
-(10^9) <= arr[i] <= 10^9`,
    inputFormat: "First line contains integer N. Second line contains N space-separated integers.",
    outputFormat: "Print the sorted array elements separated by space.",
    starterCode: `import java.util.Scanner;
class Result {
  /* This function picks an element as pivot, places the pivot element at its correct position in sorted array, and places all smaller (smaller than pivot) 
   to left of pivot and all greater elements to right of pivot */
  int partition (int array[], int low, int high) {

  }

  /* low is for left index and high is right index of the sub-array of arr to be sorted */
  void quickSort(int array[], int low, int high) {

  }
}
class Main{
  public static void main(String[] args)
  {
    int i,n;
    Scanner sc = new Scanner(System.in);
    if (!sc.hasNextInt()) return;
    n = sc.nextInt();
    int arr[] = new int[n];
    for(i=0;i<n;i++)
      arr[i] = sc.nextInt();

    Result o1 = new Result();
    o1.quickSort(arr, 0, n-1); 
    for (i=0; i < n; i++) 
      System.out.print(arr[i] + (i == n - 1 ? "" : " "));
  }
}`,
    solutionCode: `import java.util.Scanner;
class Result {
  int partition(int array[], int low, int high) {
    int pivot = array[high];
    int i = (low - 1);
    for (int j = low; j < high; j++) {
      if (array[j] <= pivot) {
        i++;
        int temp = array[i];
        array[i] = array[j];
        array[j] = temp;
      }
    }
    int temp = array[i + 1];
    array[i + 1] = array[high];
    array[high] = temp;
    return i + 1;
  }

  void quickSort(int array[], int low, int high) {
    if (low < high) {
      int pi = partition(array, low, high);
      quickSort(array, low, pi - 1);
      quickSort(array, pi + 1, high);
    }
  }
}
class Main{
  public static void main(String[] args)
  {
    int i,n;
    Scanner sc = new Scanner(System.in);
    if (!sc.hasNextInt()) return;
    n = sc.nextInt();
    int arr[] = new int[n];
    for(i=0;i<n;i++)
      arr[i] = sc.nextInt();

    Result o1 = new Result();
    o1.quickSort(arr, 0, n-1); 
    for (i=0; i < n; i++) 
      System.out.print(arr[i] + (i == n - 1 ? "" : " "));
  }
}`,
    hints: [
      {
        title: "Lomuto Partition Scheme",
        text: "Choose <code>pivot = array[high]</code>. Iterate with <code>j</code> from <code>low</code> to <code>high - 1</code>. If <code>array[j] &lt;= pivot</code>, increment <code>i</code> and swap <code>array[i]</code> with <code>array[j]</code>. Finally swap <code>array[i + 1]</code> with <code>array[high]</code> and return <code>i + 1</code>."
      }
    ],
    sampleCases: [
      {
        id: 1,
        input: "7\n1 3 5 7 2 4 9",
        expected: "1 2 3 4 5 7 9",
        explanation: "Array sorted with Quick Sort into [1, 2, 3, 4, 5, 7, 9]."
      }
    ],
    edgeCases: [
      {
        id: 2,
        input: "6\n12 11 13 5 6 7",
        expected: "5 6 7 11 12 13",
        explanation: "Array sorted with Quick Sort."
      }
    ]
  },
  q23_factorial_using_recursion: {
    id: "q23_factorial_using_recursion",
    num: "23",
    title: "Factorial using recursion",
    tag: "Recursion Basics",
    category: "Recursion -1",
    subtitle: "Base Case & Recursive Multiplicative Reduction",
    brief: `Write a recursive function factorial that accepts an integer n as a parameter and returns the factorial of n, or n!.

A factorial of an integer is defined as the product of all integers from 1 through that integer inclusive. For example, the call of factorial(4) should return 1 * 2 * 3 * 4, or 24. The factorial of 0 and 1 are defined to be 1.

You may assume that the value passed is non-negative and that its factorial can fit in the range of type int.

Input Format:
The first line of input contains number of testcases, T.
Then T lines follow, which contains an integer, n.

Output Format:
For each testcase print the factorial in new line.`,
    inputFormat: "First line contains number of testcases T. Then T lines follow, each containing an integer n.",
    outputFormat: "For each testcase, print the factorial on a new line.",
    starterCode: `import java.util.Scanner;
class Result{
  static int factorial(int n) {
    // Write your code here

      
      
  }
}
class Main{
    public static void main(String[] args){
      Scanner in = new Scanner(System.in);
      int t = in.nextInt();
      while(t-- > 0){
        int n = in.nextInt();
        System.out.println(Result.factorial(n));
      }
    }
}`,
    solutionCode: `import java.util.Scanner;

class Result {
    static int factorial(int n) {
        // Base case: 0! = 1 and 1! = 1
        if (n <= 1) {
            return 1;
        }
        // Recursive step: n! = n * (n - 1)!
        return n * factorial(n - 1);
    }
}

class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int t = in.nextInt();
        while (t-- > 0) {
            int n = in.nextInt();
            System.out.println(Result.factorial(n));
        }
    }
}`,
    hints: [
      {
        title: "Base Case",
        text: "When <code>n &lt;= 1</code>, return <code>1</code>."
      },
      {
        title: "Recursive Step",
        text: "For <code>n &gt; 1</code>, return <code>n * factorial(n - 1)</code>."
      }
    ],
    sampleCases: [
      {
        id: 1,
        input: "2\n4\n3",
        expected: "24\n6",
        explanation: "4! = 4*3*2*1 = 24. 3! = 3*2*1 = 6."
      }
    ],
    edgeCases: [
      {
        id: 2,
        input: "3\n0\n1\n5",
        expected: "1\n1\n120",
        explanation: "0! = 1, 1! = 1, 5! = 120."
      }
    ]
  }
};
