import { z } from "zod";
import { passwordProblem } from "@/lib/auth/common-passwords";

export const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ""))
  .refine((value) => /^\d{8}$/.test(value), "8 оронтой утасны дугаар оруулна уу");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "И-мэйл хаяг хэт урт байна")
  .email("И-мэйл хаяг буруу байна");

export const passwordSchema = z
  .string()
  .min(8, "Нууц үг дор хаяж 8 тэмдэгт байна")
  .max(72, "Нууц үг хэт урт байна");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Нууц үгээ оруулна уу").max(72, "Нууц үг хэт урт байна"),
});

export const registerSchema = z
  .object({
    role: z.enum(["customer", "worker"]),
    fullName: z.string().trim().min(2, "Нэрээ оруулна уу").max(80),
    phone: phoneSchema,
    email: emailSchema,
    password: passwordSchema,
    districtId: z.string().uuid().optional(),
    skills: z.array(z.string().uuid()).optional(),
    experienceNote: z.string().trim().max(500).optional(),
    consent: z.boolean(),
    declaration: z.boolean(),
    phoneCheck: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.consent) {
      ctx.addIssue({
        code: "custom",
        path: ["consent"],
        message: "Үйлчилгээний нөхцөлийг зөвшөөрнө үү",
      });
    }
    if (!value.declaration) {
      ctx.addIssue({
        code: "custom",
        path: ["declaration"],
        message:
          value.role === "worker"
            ? "Та ажил хийх хүн мөн гэдгээ баталгаажуулна уу"
            : "Та ажил хийлгэх хүн мөн гэдгээ баталгаажуулна уу",
      });
    }
    if (value.role === "worker") {
      if (!value.phoneCheck) {
        ctx.addIssue({
          code: "custom",
          path: ["phoneCheck"],
          message: "Утсаар шалгахыг зөвшөөрнө үү",
        });
      }
      if (!value.skills || value.skills.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["skills"],
          message: "Дор хаяж нэг мэргэжил сонгоно уу",
        });
      }
      if (!value.districtId) {
        ctx.addIssue({ code: "custom", path: ["districtId"], message: "Дүүргээ сонгоно уу" });
      }
    }
    // Common / email-equal / phone-equal passwords are refused server-side.
    const problem = passwordProblem(value.password, value.email, value.phone);
    if (problem) {
      ctx.addIssue({ code: "custom", path: ["password"], message: problem });
    }
  });

export const forgotSchema = z.object({ email: emailSchema });

export const resetSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((value) => value.password === value.confirm, {
    path: ["confirm"],
    message: "Нууц үг таарахгүй байна",
  });

export const staffJoinSchema = z.object({
  fullName: z.string().trim().min(2, "Нэрээ оруулна уу").max(80),
  phone: phoneSchema,
  email: emailSchema,
  password: passwordSchema,
  code: z.string().trim().min(4, "Кодоо оруулна уу"),
});

export const jobSchema = z.object({
  skillId: z.string().uuid("Мэргэжил сонгоно уу"),
  jobDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Огноо сонгоно уу"),
  jobSlot: z.enum(["full", "am", "pm"]),
  districtId: z.string().uuid("Дүүрэг сонгоно уу"),
  addressNote: z.string().trim().min(3, "Хаягаа оруулна уу").max(300),
  workersNeeded: z.coerce.number().int().min(1).max(10),
  payOffer: z.coerce.number().int().min(0).max(10_000_000).nullable(),
  description: z.string().trim().max(500).optional(),
  /** The server builds the title from the skill and the date. */
  title: z.string().trim().max(80).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type JobInput = z.infer<typeof jobSchema>;

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}
