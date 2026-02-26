import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://driickijrqmiulukqtvw.supabase.co",
  // service_role key가 없으므로 Supabase Management API를 사용
  // 대신 REST API로 테이블 존재 여부를 확인하고 안내
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyaWlja2lqcnFtaXVsdWtxdHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNjU1MDAsImV4cCI6MjA4NzY0MTUwMH0.ecBmXN1B_p7-NcOAzTRSn3fi8wzWo6GqQGq1AKW_S1w"
);

// 테이블 접근 테스트
const { data, error } = await supabase.from("inventory_sessions").select("id").limit(1);

if (error && error.code === "42P01") {
  console.log("❌ 테이블이 아직 생성되지 않았습니다.");
  console.log("Supabase 대시보드에서 SQL을 실행해주세요:");
  console.log("https://supabase.com/dashboard/project/driickijrqmiulukqtvw/sql/new");
  process.exit(1);
} else if (error) {
  console.log("❌ 에러:", error.message, error.code);
  process.exit(1);
} else {
  console.log("✅ 테이블이 이미 존재합니다! 현재 세션 수:", data.length);
}
