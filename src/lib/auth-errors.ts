export function mapAuthError(message?: string): string {
  const text = (message ?? "").toLowerCase();
  if (text.includes("invalid login credentials") || text.includes("invalid credentials")) {
    return "И-мэйл эсвэл нууц үг буруу байна";
  }
  if (text.includes("email not confirmed")) {
    return "И-мэйлээ баталгаажуулна уу. Ирсэн захидлын холбоосыг дарна уу.";
  }
  if (text.includes("already registered") || text.includes("already exists")) {
    return "Энэ и-мэйлээр бүртгэл аль хэдийн үүссэн байна";
  }
  if (text.includes("rate limit") || text.includes("too many")) {
    return "Хэт олон оролдлого. Түр хүлээгээд дахин оролдоно уу.";
  }
  if (text.includes("password")) {
    return "Нууц үг шаардлага хангахгүй байна (дор хаяж 8 тэмдэгт)";
  }
  if (text.includes("same password")) {
    return "Шинэ нууц үг өмнөхөөсөө өөр байх ёстой";
  }
  return "Алдаа гарлаа. Дахин оролдоно уу.";
}

export function mapRpcError(message?: string): string {
  const code = (message ?? "").toLowerCase();
  const dictionary: Record<string, string> = {
    forbidden: "Танд энэ үйлдэл хийх эрх байхгүй",
    not_found: "Мэдээлэл олдсонгүй",
    not_eligible: "Энэ үйлдэл хийх боломжгүй",
    job_taken: "Энэ зарыг өөр админ аль хэдийн авсан байна",
    invalid_status: "Энэ төлөвт үйлдэл хийх боломжгүй",
    invalid_admin: "Админ сонголт буруу байна",
    invalid_slot: "Цагийн сонголт буруу байна",
    invalid_day: "Өдөр буруу байна",
    invalid_code: "Код буруу байна",
    expired_code: "Кодын хугацаа дууссан байна",
    used_code: "Энэ код аль хэдийн ашиглагдсан байна",
    last_super: "Сүүлийн супер админыг хаах боломжгүй",
    self_forbidden: "Өөрийн эрхийг өөрчлөх боломжгүй",
    has_assignments: "Хүлээн авсан ажилтантай тул буцаах боломжгүй",
    skill_mismatch: "Ажилтны мэргэжил таарахгүй байна",
    not_free: "Ажилтан энэ өдөр чөлөөтэй биш байна",
    double_booked: "Ажилтан энэ өдөр өөр ажилтай байна",
    already_offered: "Энэ ажилтанд санал аль хэдийн явуулсан",
    full: "Ажлын ажилтны тоо дүүрсэн байна",
    booked: "Энэ өдөр ажилтай тул өөрчлөх боломжгүй",
    confirmed_day: "Админ баталгаажуулсан өдрийг өөрчлөх боломжгүй",
    past_day: "Өнгөрсөн өдөр өөрчлөх боломжгүй",
    invalid_district: "Дүүрэг буруу байна",
    invalid_key: "Тохиргооны түлхүүр буруу байна",
  };
  for (const [key, value] of Object.entries(dictionary)) {
    if (code.includes(key)) return value;
  }
  return "Алдаа гарлаа. Дахин оролдоно уу.";
}
