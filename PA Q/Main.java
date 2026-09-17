import java.util.*;
class Result {
  static int maxFrequency(int A[], int n) {
    Map<Integer, Integer> map = new HashMap<>();
    int maxFreq = 0;
    int minVal = Integer.MAX_VALUE;
    for (int x : A) {
      int f = map.getOrDefault(x, 0) + 1;
      map.put(x, f);
    }
    for (Map.Entry<Integer, Integer> entry : map.entrySet()) {
      int val = entry.getKey();
      int f = entry.getValue();
      if (f > maxFreq) {
        maxFreq = f;
        minVal = val;
      } else if (f == maxFreq) {
        if (val < minVal) {
          minVal = val;
        }
      }
    }
    return minVal;
  }
}
class Main {
  public static void main(String[] args) {
    int t, n, i;
    Scanner s = new Scanner(System.in);
    if (!s.hasNextInt()) return;
    t = s.nextInt();
    while(t != 0) {
      n = s.nextInt();
      int[] a = new int[n];
      for (i = 0; i < n; i++)
        a[i] = s.nextInt();
      System.out.println(Result.maxFrequency(a, n));
      t--;
    }
  }
}