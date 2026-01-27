![](content/images/test_image.png)

# RootLayout

가장 상위의 layout을 RootLayout이라 하며, 반드시 존재해야 한다. 만약 실수로 최상위 layout.tsx을 삭제하면 next에서 자동으로 layout.tsx를 생성해준다. 이 곳에 html과 body 태그가 있기 때문이다.

# Custom layout

```tsx
import { ReactNode } from "react";

export default function Layout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div>
      <div>임시 서치바</div>
      <div>{children}</div>
    </div>
  );
}
```

# Route Group

: 경로상에는 아무런 영향을 미치지 않는 폴더

```
/app
	(with-searchbar)
		/search
			page.tsx
		layout.tsx
		page.tsx

```

이렇게 하면
`/` 페이지랑 `/search` 페이지 둘 다 layout이 적용된다.

**개인적인 생각:**
장단점이 있을 것 같다. 가상 폴더처럼 사용할 수는 있지만 수직적인 Directory 구조로 되어있어서 자유도가 기존 방식에 비해 떨어지는 느낌? 간단한 구조라면 이렇게 사용할 수 있지만 특정 레이아웃이 여러 경로에서 사용된다면 폴더 구조 짜기가 힘들 것 같다. 또한 약간씩 바꿔서 사용하기에도 좀 어렵다는 느낌이다. 하위 경로에 전부 똑같은 레이아웃이 적용되기 때문에 예외 케이스나 약간 바꿔서 사용하기에도 한계가 있어보임
하지만 기존 방식을 사용하지 못하는 것이 아니니(getLayout) 선택적으로 적용할 수 있어 선택지가 늘어서 좋은듯!

# Co-location

layout 파일이나 page 파일이 아닌 컴포넌트들은 따로 경로에도 포함되지 않고 그냥 재활용 가능한 컴포넌트로 생각하면 된다. 따라서 페이지나 레이아웃에 사용할 컴포넌트들을 폴더 구조 상에서 가까이 위치하도록 모아둘 수 있는데 이러한 특징을 co-location이라 한다.
