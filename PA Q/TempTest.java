import java.util.Scanner;
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
}